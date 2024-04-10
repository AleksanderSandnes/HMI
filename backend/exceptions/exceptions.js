/**
 * @class
 * 
 * @classdesc Prints an HTTP error message along with its code
 * @extends Error
 */
class HTTPRequestException extends Error {
    constructor(code, msg = "Error in HTTP request") {
        super(msg);
        console.log("HTTP Code: " + code);
        this.name = "HTTPRequestException";
    }
}

/**
 * @class
 * 
 * @classdesc Prints an error message while logging in and provides information to the user
 * @extends Error
 */
class SessionAuthenticationException extends Error {
    constructor(info, msg = "Failed to log in") {
        super(msg);
        console.log("Response: " + info);
        this.name = "SessionAuthenticationException";
    }
}

/**
 * @class
 * 
 * @classdesc Prints an error message in the request and provides information to the user
 * @extends Error
 */
class ServerResponseException extends Error {
    constructor(info, msg = "An error occurred during the request") {
        super(msg);
        this.name = "ServerResponseException";
        console.log(info);
    }
}

/**
 * @class
 * 
 * @classdesc Prints an error message indicating that the request was not initiated and provides information to the user
 * @extends Error
 */
class SessionNotInitializedException extends Error {
    constructor(info, msg = "An open session is required to make calls!") {
        super(msg);
        this.name = "SessionNotInitializedException";
        console.log(info);
    }
}

module.exports = { HTTPRequestException, SessionAuthenticationException, ServerResponseException, SessionNotInitializedException };
