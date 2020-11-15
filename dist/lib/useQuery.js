"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLazyQuery = exports.useQuery = void 0;
const client_1 = require("@apollo/client");
exports.useQuery = (query, options) => {
    const result = client_1.useQuery(query.query, Object.assign({ variables: query.variables }, options));
    if (result.called && result.error) {
        throw result.error;
    }
    return [result.data, result];
};
exports.useLazyQuery = (queryTemplate, options) => {
    const { query } = queryTemplate(null);
    const [runQuery, result] = client_1.useLazyQuery(query, options);
    const wrappedRunQuery = (variables, options) => {
        runQuery(Object.assign(Object.assign({}, (options || {})), { variables }));
    };
    if (result.called && result.error) {
        throw result.error;
    }
    return [wrappedRunQuery, result.data, result];
};
