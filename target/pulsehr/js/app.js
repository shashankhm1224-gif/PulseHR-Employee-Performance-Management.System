
const $ = s => document.querySelector(s);

let data = [];
let chart = null;

async function req(url, opt = {}) {
    const r = await fetch(url, opt);
    if (!r.ok) {
        const error = await r.json().catch(() => ({}));
        throw Error(error.message || "Request failed");
    }
    return r.json();
}

function safe(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

// LOGIN
function dashboard() {
    $("#login").classList.add("hide");
    $("#dash").classList.remove("hide");
    $("#logout").classList.remove("hide");
    load();
}

$("#loginForm").onsubmit = async e => {
    e.preventDefault();

    try {
        await req("api/login", {
            method: "POST",
            body: new URLSearchParams(new FormData(e.target))
        });

        $("#loginMsg").textContent = "";
        dashboard();

    } catch {
        $("#loginMsg").textContent = "Invalid login";
    }
};

// LOGOUT
$("#logout").onclick = async () => {
    try {
        await req("api/logout", { method: "POST" });
    } finally {
        $("#dash").classList.add("hide");
        $("#logout").classList.add("hide");
        $("#login").classList.remove("hide");
    }
};

// ADD EMPLOYEE
$("#empForm").onsubmit = async e => {
    e.preventDefault();

    try {
        await req("api/employees", {
            method: "POST",
            body: new URLSearchParams(new FormData(e.target))
        });

        e.target.reset();
        $("#formMsg").textContent = "Employee saved successfully!";
        await load();

    } catch (err) {
        $("#formMsg").textContent = err.message;
    }
};

// LOAD EMPLOYEES
async function load() {
    try {
        data = await req("api/employees");
        render();
        populateEmployees();
        await loadReviews();
    } catch (err) {
        console.error(err);
    }
}

// EMPLOYEE DROPDOWN
function populateEmployees() {
    const select = $("#reviewEmployee");
    const previous = select.value;

    select.innerHTML =
        '<option value="">Select an employee</option>' +
        data.map(x =>
            `<option value="${x.id}">${safe(x.name)} - ${safe(x.department)}</option>`
        ).join("");

    if (data.some(x => String(x.id) === previous)) {
        select.value = previous;
    }
}

// EMPLOYEE TABLE AND ANALYTICS
function render() {
    const q = $("#search").value.toLowerCase();

    const filtered = data.filter(x =>
        `${x.name} ${x.department} ${x.role}`.toLowerCase().includes(q)
    );

    $("#rows").innerHTML = filtered.map(x => `
        <tr>
            <td>${safe(x.name)}</td>
            <td>${safe(x.department)}</td>
            <td>${safe(x.role)}</td>
            <td>${x.score}</td>
            <td>${safe(x.reviewMonth)}</td>
            <td>
                <button class="secondary del" data-id="${x.id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("") || '<tr><td colspan="6">No records found</td></tr>';

    $("#total").textContent = data.length;

    $("#avg").textContent = data.length
        ? (data.reduce((s, x) => s + Number(x.score || 0), 0) / data.length).toFixed(1)
        : 0;

    $("#depts").textContent =
        new Set(data.map(x => x.department).filter(Boolean)).size;

    document.querySelectorAll(".del").forEach(button => {
        button.onclick = async () => {
            if (!confirm("Delete this employee?")) return;

            try {
                await req("api/employees?id=" + button.dataset.id, {
                    method: "DELETE"
                });
                await load();
            } catch (err) {
                alert(err.message);
            }
        };
    });

    if (chart) chart.destroy();

    chart = new Chart($("#chart"), {
        type: "bar",
        data: {
            labels: data.map(x => x.name),
            datasets: [{
                label: "Performance Score",
                data: data.map(x => x.score),
                backgroundColor: "#1769df",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// EMPLOYEE SEARCH
$("#search").oninput = render;

// SUBMIT PERFORMANCE REVIEW
$("#reviewForm").onsubmit = async e => {
    e.preventDefault();

    const message = $("#reviewMsg");
    message.textContent = "Saving review...";

    try {
        await req("api/reviews", {
            method: "POST",
            body: new URLSearchParams(new FormData(e.target))
        });

        message.textContent = "Performance review saved successfully!";
        e.target.reset();

        await loadReviews();

    } catch (err) {
        message.textContent = err.message || "Could not save review";
    }
};

// LOAD PERFORMANCE HISTORY
async function loadReviews() {
    try {
        const reviews = await req("api/reviews");

        $("#reviewRows").innerHTML = reviews.map(r => `
            <tr>
                <td>${safe(r.employeeName)}</td>
                <td>${"⭐".repeat(Math.max(0, Math.min(5, Number(r.rating))))}</td>
                <td>${safe(r.reviewMonth)}</td>
                <td>${safe(r.feedback)}</td>
                <td>${r.createdAt ? safe(new Date(r.createdAt).toLocaleDateString()) : "-"}</td>
            </tr>
        `).join("") ||
        '<tr><td colspan="5">No reviews available yet.</td></tr>';

    } catch (err) {
        $("#reviewRows").innerHTML =
            '<tr><td colspan="5">Unable to load review history.</td></tr>';
        console.error(err);
    }
}

// REFRESH HISTORY
$("#refreshReviews").onclick = loadReviews;

// CSV EXPORT
$("#export").onclick = () => {
    const lines = [
        ["Name", "Email", "Department", "Role", "Score", "Feedback", "Review month"],
        ...data.map(x => [
            x.name, x.email, x.department, x.role,
            x.score, x.feedback, x.reviewMonth
        ])
    ];

    const csv = lines.map(row =>
        row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")
    ).join("\n");

    const a = document.createElement("a");

    a.href = URL.createObjectURL(
        new Blob([csv], { type: "text/csv" })
    );

    a.download = "pulsehr-employees.csv";
    a.click();

    URL.revokeObjectURL(a.href);
};
