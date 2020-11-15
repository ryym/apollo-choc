"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineQuery = void 0;
// Define a query with the type of its variables and result.
exports.defineQuery = ({ query, invalidates, }) => {
    const template = (variables) => ({ query, variables });
    if (invalidates != null) {
        const invalidatesOn = (mutation, queryVariables) => {
            const dependentQuery = (v, p) => {
                return queryVariables ? template(queryVariables(v, p)) : template();
            };
            mutation.invalidations.push(dependentQuery);
        };
        invalidates(invalidatesOn);
    }
    return template;
};
