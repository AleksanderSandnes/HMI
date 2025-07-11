/**

This script controls session information.
The Session class stores credentials and access options for the server, as well as cookies and HTTP headers.
The methods handle login and logout on the server. For each call made, there is a method that validates cookies.
*/

const { links } = require('../utils/solarLinks.js');
const Axios = require('axios');
const Url = require('url');
const https = require('https');
const {
  HTTPRequestException,
  SessionAuthenticationException,
  ServerResponseException,
  SessionNotInitializedException,
} = require('../exceptions/exceptions.js');
const { calls } = require('./solarCalls.js');
const { md5Hash } = require('../utils/crypto.js');

const userAgentDefault = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

class Session {
  /**
   *
   * @param {string} username admin account username
   * @param {string} password admin account password
   * @param {string} server Growatt server address
   * @param {Object} headers options for an HTTP header
   */
  constructor(
    username,
    password,
    server = 'https://server.growatt.com/',
    headers
  ) {
    this.username = username;
    this.password = password;
    this.isConnected = false;
    this.server = server;
    this.getUrl = this.getUrl.bind(this); // temp?

    if (headers === undefined)
      this.headers = {
        'User-Agent': userAgentDefault,
        Connection: 'keep-alive',
      };
    else this.headers = headers;

    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    this.axios = Axios.create({
      baseURL: server,
      timeout: 30000,
      headers: headers,
      httpsAgent,
    });
  }

  /**
   * Concatenates the server address with the resource given by path
   *
   * The parameter is passed to the links object, as they are all predetermined.
   *
   * @param {string} path resource on the server
   * @returns {String} complete URL (server/path)
   */

  getUrl(path) {
    return this.server + links[path];
  }

  /**
   * Logs in to the server based on the provided credentials
   *
   * @throws {SessionAuthenticationException} if login fails
   * @throws {ServerResponseException} if there's an issue accessing the resource or with the HTTP protocol
   * @returns {Object} Response data object
   */

  async login() {
    return new Promise((resolve, reject) => {
      delete this.headers.cookie;
      delete this.cookie;

      // Hash password with MD5 for Growatt API
      const hashedPassword = md5Hash(this.password);
      const params = new Url.URLSearchParams({
        account: this.username,
        password: hashedPassword,
        validateCode: '',
      });

      this.axios
        .post(this.getUrl('login'), params.toString(), {
          headers: this.headers,
        })
        .then((res) => {
          if (res.data && res.data.result && res.data.result === 1) {
            // Correct request
            this.cookie = res.headers['set-cookie'].toString();
            this.headers.cookie = this.cookie;
            const cookies = this.cookie.split(';');

            // Obtaining JSESSIONID from cookies for later use

            const JSESSIONID = (() => {
              let session;
              const cookies = this.cookie.split(';');
              cookies.forEach((e) => {
                if (e.startsWith('JSESSIONID')) [, session] = e.split('=');
              });

              return session;
            })();

            // Obtaining expiration date

            for (let i = 0; i < cookies.length; i++) {
              if (cookies[i].startsWith(' Expires')) {
                this.cookieExpiration = cookies[i].split('=')[1];
                break;
              }
            }

            this.headers.Referer = `${this.server}index;jsessionid=${JSESSIONID}`;

            this.isConnected = true;
            resolve({ result: 1, login: 'Login successful' });
          } else if (res.data && res.data.result)
            throw new SessionAuthenticationException(res.data);
          else calls.Calls.prototype.handleRequestProblem(res);
        })
        .catch((res) => {
          reject(res);
          throw new SessionAuthenticationException(res);
        });
    });
  }

  /**
   * Logs out from the server
   * @returns {Object} Object with response result and logout message
   */

  async logout() {
    return new Promise((resolve, reject) => {
      this.axios
        .get(this.getUrl('logout'), { headers: this.headers })
        .then((res) => {
          this.cookie = '';
          this.isConnected = false;
          this.cookieExpiration = null;
          this.headers.cookie = '';

          resolve({ result: 1, logout: 'Logout successful' });
        })
        .catch((res) => reject(res));
    });
  }

  /**
   * Checks if the session is open or if the cookie has expired
   */

  async checkCookieValidity() {
    if (
      !this.isConnected ||
      new Date(this.cookieExpiration).getTime() < new Date().getTime()
    ) {
      console.log(
        'Session closed or cookie expired. New login will be performed...'
      );
      await this.login();
    }
  }
}

module.exports = { Session };
