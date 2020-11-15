import { GraphQLError, DocumentNode } from 'graphql';
import { useMutation as useApolloMutation } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import { Mutation, MutationTemplate, MutationResult, DependentQuery } from './defineMutation';

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

  const wrappedMutate: any = async (
    args: V | [V, IP],
    options = {}
  ): Promise<MutationResult<R>> => {
    const [variables, invalidationParams] = Array.isArray(args) ? args : [args];
    const { data, errors, extensions } = await mutate({ variables, ...options });
    if (errors != null) {
      return [{ errors }, { extensions }];
    }
    if (data == null) {
      throw new Error('Both of data and errors in mutation result are undefined.');
    }
    if (result.client == null) {
      throw new Error('Apollo client does not exist in the result of useMutation');
    }

    // TODO: Enable to await invalidations.
    invalidateCaches(invalidations, result.client, variables, invalidationParams as IP);

    return [{ errors: undefined, data }, { extensions }];
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
