"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMutation = void 0;
const client_1 = require("@apollo/client");
exports.useMutation = ({ mutation, invalidations }, options) => {
    const [mutate, result] = client_1.useMutation(mutation, options);
    const wrappedMutate = (args, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
        const [variables, invalidationParams] = Array.isArray(args) ? args : [args];
        let fetchResult = null;
        try {
            fetchResult = yield mutate(Object.assign({ variables }, options));
        }
        catch (error) {
            if (error instanceof client_1.ApolloError) {
                return { error, data: undefined };
            }
            throw error;
        }
        // FIXME: I don't know when this errors are set so throw it for now.
        // (Also I don't know what fetchResult.extensions and context are...)
        if (fetchResult.errors != null) {
            throw new client_1.ApolloError({ graphQLErrors: fetchResult.errors });
        }
        if (fetchResult.data == null) {
            throw new Error('[apollo-choc] no error occurs but data does not exist');
        }
        if (result.client == null) {
            throw new Error('[apollo-choc] Apollo client does not exist in the result of useMutation');
        }
        // TODO: Enable to await invalidations.
        invalidateCaches(invalidations, result.client, variables, invalidationParams);
        return { error: undefined, data: fetchResult.data };
    });
    return [wrappedMutate, result];
};
const doesCacheExist = (client, query, variables) => {
    try {
        client.readQuery({ query, variables });
        return true;
    }
    catch (_a) {
        return false;
    }
};
const invalidateCaches = (invalidations, client, mutationVariables, invalidationParams) => __awaiter(void 0, void 0, void 0, function* () {
    if (invalidations.length === 0) {
        return;
    }
    const queryPromises = [];
    for (const makeQuery of invalidations) {
        const { query, variables } = makeQuery(mutationVariables, invalidationParams);
        if (doesCacheExist(client, query, variables)) {
            const promise = client.query({ query, variables, fetchPolicy: 'network-only' });
            queryPromises.push(promise);
        }
    }
    return Promise.all(queryPromises);
});
