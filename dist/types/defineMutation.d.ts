import { DocumentNode } from 'graphql';
import type * as Apollo from '@apollo/client';
import { Query } from './query';
export declare type Extensions = Record<string, any>;
export interface MutationResultDetails {
    readonly extensions?: Extensions;
}
export declare type Mutation<R, V, IP> = (variables: MutationArg<V, IP>, options?: Apollo.MutationFunctionOptions) => Promise<MutationResult<R>>;
export declare type MutationArg<V, IP> = IP extends undefined ? V : [V, IP];
export declare type MutationResult<R> = {
    readonly error: undefined;
    readonly data: R;
} | {
    readonly error: Apollo.ApolloError;
    readonly data: undefined;
};
export interface MutationConfig<IP> {
    __ghost?: IP;
    mutation: DocumentNode;
}
export interface MutationTemplate<Result, Variables, InvalidationParams = undefined> {
    readonly __ghost?: [Result, Variables, InvalidationParams];
    readonly mutation: DocumentNode;
    invalidations: DependentQuery<Variables, InvalidationParams>[];
}
export declare type DependentQuery<V, IP> = (v: V, p: IP) => Query<any, any>;
export declare const defineMutation: <R, V = null, IP = undefined>({ mutation, }: MutationConfig<IP>) => MutationTemplate<R, V, IP>;
