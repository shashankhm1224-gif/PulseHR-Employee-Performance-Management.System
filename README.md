# PulseHR – Employee Performance Management System

Starter/demo implementation generated from the specifications shared in chat.

## Stack
HTML5, CSS3, JavaScript, Chart.js, Java 17, Jakarta Servlets 5, JDBC, H2, Gson, jBCrypt, Maven, Jetty 11.

## Run locally
1. Install JDK 17+ and Maven.
2. Open this folder in VS Code / terminal.
3. Run `mvn clean package`
4. Run `mvn jetty:run`
5. Visit http://localhost:8080/

Demo admin: `admin` / `admin123`

## Features in this starter
Admin sign-in/out, session-protected employee listing, add/delete employee records, review score and feedback fields, dashboard summary, search, Chart.js score chart, CSV export.

## Important limitations
This is a new starter project created from the feature/technology description, not a copy of the original PulseHR source folder or its exact implementation. H2 is in-memory and resets when the server stops. Edit/update employee workflow, production-grade security, persistent database storage, CSRF protection, deployment configuration and backups should be added before real-world use. Change the demo password before sharing.
