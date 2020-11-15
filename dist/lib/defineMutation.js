"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineMutation = void 0;
// Define mutation query with the type of its variables and result.
exports.defineMutation = ({ mutation, }) => {
    return { mutation, invalidations: [] };
};
