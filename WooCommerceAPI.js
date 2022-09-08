import { Component } from 'react'

import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';

/**
 * WooCommerce REST API wrapper
 *
 * @param {Object} opt
 */
export default class WooCommerceAPI extends Component {

  constructor(props) {
    super(props);

    if (!this.props.url) {
      throw new Error('url is required');
    }

    if (!this.props.consumerKey) {
      throw new Error('consumerKey is required');
    }

    if (!this.props.consumerSecret) {
      throw new Error('consumerSecret is required');
    }

    this.url = this.props.url;
    this.wpAPI = this.props.wpAPI || false;
    this.wpAPIPrefix = this.props.wpAPIPrefix || 'wp-json';
    this.version = this.props.version || 'v3';
    this.isSsl = /^https/i.test(this.url);
    this.consumerKey = this.props.consumerKey;
    this.consumerSecret = this.props.consumerSecret;
    this.verifySsl = false === this.props.verifySsl ? false : true;
    this.encoding = this.props.encoding || 'utf8';
    this.queryStringAuth = this.props.queryStringAuth || false;
    this.port = this.props.port || '';
    this.timeout = this.props.timeout;

    this.classVersion = '1.0.1';

    this._normalizeQueryString = (url) => {
      // Exit if don't find query string
      if (-1 === url.indexOf('?')) {
        return url;
      }

      let query = url;
      let params = [];
      let queryString = '';

      for (let p in query) {
        params.push(p);
      }
      params.sort();

      for (let i in params) {
        if (queryString.length) {
          queryString += '&';
        }

        queryString += encodeURIComponent(params[i])
          .replace('%5B', '[')
          .replace('%5D', ']');
        queryString += '=';
        queryString += encodeURIComponent(query[params[i]]);
      }

      return url.split('?')[0] + '?' + queryString;
    };


    this._getUrl = (endpoint) => {
      let url = '/' === this.url.slice(-1) ? this.url : this.url + '/';
      let api = this.wpAPI ? this.wpAPIPrefix + '/' : 'wp-json/';

      url = url + api + this.version + '/' + endpoint;

      // Include port.
      if ('' !== this.port) {
        let hostname = url; //_url.parse(url, true).hostname;
        url = url.replace(hostname, hostname + ':' + this.port);
      }

      if (!this.isSsl) {
        return this._normalizeQueryString(url);
      }

      return url;
    };

    this._getOAuth = () => {
      var data = {
        consumer: {
          key: this.consumerKey,
          secret: this.consumerSecret,
        },
        signature_method: 'HMAC-SHA256',
        hash_function: (base_string, key) => {
          return CryptoJS.HmacSHA256(base_string, key).toString(
            CryptoJS.enc.Base64
          );
        },
      };

      if (-1 < ['v1', 'v2'].indexOf(this.version)) {
        data.last_ampersand = false;
      }
      return new OAuth(data);
    };

    this.join = (obj, separator) => {
      let arr = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          arr.push(key + '=' + obj[key]);
        }
      }

      return arr.join(separator);
    };

    this._request = (method, endpoint, data) => {
      var url = this._getUrl(endpoint);
      var getHeader = false;

      var params = {
        encoding: this.encoding,
        timeout: this.timeout,
        headers: {
          'User-Agent': 'WooCommerce API React Native/' + this.classVersion,
          'Content-Type': 'application/json',
        },
      };

      if (this.isSsl) {
        if (this.queryStringAuth) {
          params.qs = {
            consumer_key: this.consumerKey,
            consumer_secret: this.consumerSecret,
          };
        } else {
          params.auth = {
            user: this.consumerKey,
            pass: this.consumerSecret,
          };
        }

        if (!this.verifySsl) {
          params.strictSSL = false;
        }
      } else {
        params.qs = this._getOAuth().authorize({
          url: url + '?' + this.join(data, '&'),
          method: method,
        });
      }

      // encode the oauth_signature to make sure it not remove + charactor
      //params.qs.oauth_signature = encodeURIComponent(params.qs.oauth_signature);
      var requestUrl = url + '?' + this.join(params.qs, '&');
      // console.log(data)
      if (method === 'GET') {
        if (data) {
          requestUrl += '&' + this.join(data, '&');
          getHeader = typeof data.header !== 'undefined' ? data.header : false;
        }

        // console.log('encode', params.qs.oauth_signature);
        //console.log(requestUrl);
        return fetch(requestUrl, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        }).then((response) => getHeader ? response.json().then(data => ({ header: response.headers, data: data })) : response.json());
      } else {
        return fetch(requestUrl, {
          method: method,
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        }).then((response) => response.json());
      }
    };

    this.get = (endpoint, data) => {
      return this._request('GET', endpoint, data);
    };
    this.post = (endpoint, data) => {
      return this._request('POST', endpoint, data);
    };
    this.put = (endpoint, data) => {
      return this._request('PUT', endpoint, data);
    };
    this.delete = (endpoint) => {
      return this._request('DELETE', endpoint, null);
    };
    this.options = (endpoint) => {
      return this._request('OPTIONS', endpoint, null);
    };
  }
};