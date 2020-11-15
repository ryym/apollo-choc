import { DocumentNode } from 'graphql';
import type * as Apollo from '@apollo/client';
import { Query } from './query';

export type Extensions = Record<string, any>;

export interface MutationResultDetails {
  readonly extensions?: Extensions;
}

export type Mutation<R, V, IP> = IP extends undefined
  ? MutationFn<R, V>
  : MutationWithInvalidationFn<R, V, IP>;

export type MutationResult<R> =
  | {
      readonly error: undefined;
      readonly data: R;
    }
  | {
      readonly error: Apollo.ApolloError;
      readonly data: undefined;
    };

export type MutationFn<R, V> = (
  variables: V,
  options?: Apollo.MutationFunctionOptions
) => Promise<MutationResult<R>>;

export type MutationWithInvalidationFn<R, V, IP> = (
  variables: V,
  invalidationParams: IP,
  options?: Apollo.MutationFunctionOptions
) => Promise<MutationResult<R>>;

export interface MutationConfig<IP> {
  __ghost?: IP;
  mutation: DocumentNode;
}

export interface MutationTemplate<Result, Variables, InvalidationParams = undefined> {
  readonly __ghost?: [Result, Variables, InvalidationParams];
  readonly mutation: DocumentNode;
  invalidations: DependentQuery<Variables, InvalidationParams>[];
}

export type DependentQuery<V, IP> = (v: V, p: IP) => Query<any, any>;

// Define mutation query with the type of its variables and result.
export const defineMutation = <R, V = null, IP = undefined>({
  mutation,
}: MutationConfig<IP>): MutationTemplate<R, V, IP> => {
  return { mutation, invalidations: [] };
};
