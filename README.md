# CODEX

COmplex Data EXplorer

## Running CODEX in Docker

A version of CODEX for development can be run in Docker for ease of setup. (You'll need to install [Docker](https://www.docker.com/]) on your system first.)
Note: You can improve your CODEX performance by giving Docker more resources than the default.  This is done under Docker Preferences->Resources.  Increasing your CPUs, RAM and swap will all improve your performance on large datasets.

To start, run `docker-compose up` in the root directory of this repo. Docker will build two different images, one for the backend (using the `Dockerfile` in `server/`) and one with the web client (using the `Dockerfile` in `client/`). Note that the installation and build may take a while to complete.

The client will be available at http://localhost:3000. (port selection can be set in the `docker-compose.yaml` file.)

Copyright 2019, by the California Institute of Technology. ALL RIGHTS RESERVED. United States Government Sponsorship acknowledged. Any commercial use must be negotiated with the Office of Technology Transfer at the California Institute of Technology.
This software may be subject to U.S. export control laws. By accepting this software, the user agrees to comply with all applicable U.S. export laws and regulations. User has the responsibility to obtain export licenses, or other export authority as may be required before exporting such information to foreign countries or providing access to foreign persons.