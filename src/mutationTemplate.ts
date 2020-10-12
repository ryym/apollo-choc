import { GraphQLError, DocumentNode } from 'graphql';
import { useMutation as useApolloMutation } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import { Query } from './query';

export type Extensions = Record<string, any>;

export interface MutationResultDetails {
  readonly extensions?: Extensions;
}

export type Mutation<R, V, IP> = IP extends undefined
  ? MutationFn<R, V>
  : MutationWithInvalidationFn<R, V, IP>;

export type MutationFn<R, V> = (
  variables: V,
  options?: Apollo.MutationFunctionOptions
) => Promise<[R, MutationResultDetails]>;

export type MutationWithInvalidationFn<R, V, IP> = (
  variables: V,
  invalidationParams: IP,
  options?: Apollo.MutationFunctionOptions
) => Promise<[R, MutationResultDetails]>;

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
export const createMutation = <R, V = null, IP = undefined>({
  mutation,
}: MutationConfig<IP>): MutationTemplate<R, V, IP> => {
  return { mutation, invalidations: [] };
};

export class MutationError extends Error {
  readonly name = '[apollo-choc] MutationError';
  readonly graphQLErrors: readonly GraphQLError[];

  constructor(message: string, errors: readonly GraphQLError[]) {
    super(message);
    this.graphQLErrors = errors;
  }
}

export const useMutation = <R, V = null, IP = null>(
  { mutation, invalidations }: MutationTemplate<R, V, IP>,
  options?: Apollo.MutationHookOptions<R, V>
): [Mutation<R, V, IP>, Apollo.MutationResult<R>] => {
  const [mutate, result] = useApolloMutation(mutation, options);

  const wrappedMutate: any = async (args: V | [V, IP], options = {}) => {
    const [variables, invalidationParams] = Array.isArray(args) ? args : [args];
    const { data, errors, extensions } = await mutate({ variables, ...options });
    if (errors != null) {
      throw new MutationError('MutationError', errors);
    }
    if (data == null) {
      throw new Error('Both of data and errors in mutation result are undefined.');
    }
    if (result.client == null) {
      throw new Error('Apollo client does not exist in the result of useMutation');
    }

    // TODO: Enable to await invalidations.
    invalidateCaches(invalidations, result.client, variables, invalidationParams as IP);

    return [data, { extensions }];
  };

  return [wrappedMutate, result];
};

const doesCacheExist = (
  client: Apollo.ApolloClient<any>,
  query: DocumentNode,
  variables?: null
): boolean => {
  try {
    client.readQuery({ query, variables });
    return true;
  } catch {
    return false;
  }
};

const invalidateCaches = async <V, IP>(
  invalidations: DependentQuery<V, IP>[],
  client: Apollo.ApolloClient<any>,
  mutationVariables: V,
  invalidationParams: IP
): Promise<unknown> => {
  if (invalidations.length === 0) {
    return;
  }

  const queryPromises: Promise<unknown>[] = [];
  for (const makeQuery of invalidations) {
    const { query, variables } = makeQuery(mutationVariables, invalidationParams);
    if (doesCacheExist(client, query, variables)) {
      const promise = client.query({ query, variables, fetchPolicy: 'network-only' });
      queryPromises.push(promise);
    }
  }

  return Promise.all(queryPromises);
};
