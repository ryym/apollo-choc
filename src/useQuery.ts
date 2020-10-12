import { useQuery as useApolloQuery, useLazyQuery as useApolloLazyQuery } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import { Query } from './query';
import { QueryTemplate } from './defineQuery';

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
