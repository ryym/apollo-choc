import { DocumentNode } from 'graphql';
import { useMutation as useApolloMutation, ApolloError } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import { Mutation, MutationTemplate, MutationResult, DependentQuery } from './defineMutation';

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

    let fetchResult: Apollo.FetchResult<R> | null = null;
    try {
      fetchResult = await mutate({ variables, ...options });
    } catch (error: unknown) {
      if (error instanceof ApolloError) {
        return { error, data: undefined };
      }
      throw error;
    }

    // FIXME: I don't know when this errors are set so throw it for now.
    // (Also I don't know what fetchResult.extensions and context are...)
    if (fetchResult.errors != null) {
      throw new ApolloError({ graphQLErrors: fetchResult.errors });
    }

    if (fetchResult.data == null) {
      throw new Error('[apollo-choc] no error occurs but data does not exist');
    }
    if (result.client == null) {
      throw new Error('[apollo-choc] Apollo client does not exist in the result of useMutation');
    }

    // TODO: Enable to await invalidations.
    invalidateCaches(invalidations, result.client, variables, invalidationParams as IP);

    return { error: undefined, data: fetchResult.data };
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
