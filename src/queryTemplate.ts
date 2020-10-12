import { useQuery as useApolloQuery, useLazyQuery as useApolloLazyQuery } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import { DocumentNode } from 'graphql';
import { Query } from './query';
import { MutationTemplate } from './mutationTemplate';

export type QueryTemplate<R, V> = V extends null ? () => Query<R, V> : (v: V) => Query<R, V>;

export interface QueryConfig<V> {
  query: DocumentNode;
  invalidates?: (on: InvalidatesOn<V>) => InvalidationConfig<any, any, V>[];
}

export type InvalidatesOn<QV> = QV extends null
  ? <MV, IP>(mut: MutationTemplate<any, MV, IP>) => InvalidationConfig<MV, IP, never>
  : <MV, IP>(
      mut: MutationTemplate<any, MV, IP>,
      createVariables: (mutVar: MV, invParams: IP) => QV
    ) => InvalidationConfig<MV, IP, QV>;

export interface InvalidationConfig<V, IP, QV> {
  mutation: MutationTemplate<any, any>;
  queryVariables?: (mutVar: V, invParams: IP) => QV;
}

// Define a query with the type of its variables and result.
export const createQuery = <R, V = null>({
  query,
  invalidates,
}: QueryConfig<V>): QueryTemplate<R, V> => {
  const template = (variables: V) => ({ query, variables });

  if (invalidates != null) {
    const invalidatesOn: any = (
      mutation: MutationTemplate<any, any>,
      queryVariables: (v: any, p: any) => V
    ) => {
      const dependentQuery = (v: any, p: any) => {
        return queryVariables ? template(queryVariables(v, p)) : (template as any)();
      };
      mutation.invalidations.push(dependentQuery);
    };
    invalidates(invalidatesOn);
  }

  return template as QueryTemplate<R, V>;
};

export const useQuery = <R, V>(
  query: Query<R, V>,
  options?: Apollo.QueryHookOptions<R, V>
): [R | undefined, Apollo.QueryResult<R, V>] => {
  const result = useApolloQuery<R, V>(query.query, {
    variables: query.variables,
    ...options,
  });
  if (result.called && result.error) {
    throw result.error;
  }
  return [result.data, result];
};

export type WrappedLazyQuery<V> = V extends null
  ? (variables?: null, options?: Apollo.QueryLazyOptions<V>) => void
  : (variables: V, options?: Apollo.QueryLazyOptions<V>) => void;

export const useLazyQuery = <R, V>(
  queryTemplate: QueryTemplate<R, V>,
  options?: Apollo.LazyQueryHookOptions<R, V>
): [WrappedLazyQuery<V>, R | undefined, Apollo.LazyQueryResult<R, V>] => {
  const { query } = queryTemplate(null as any);
  const [runQuery, result] = useApolloLazyQuery<R, V>(query, options);

  const wrappedRunQuery = (variables?: V, options?: Apollo.QueryLazyOptions<V>): void => {
    runQuery({ ...(options || {}), variables });
  };

  if (result.called && result.error) {
    throw result.error;
  }

  return [wrappedRunQuery as WrappedLazyQuery<V>, result.data, result];
};
