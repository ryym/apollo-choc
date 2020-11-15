import type * as Apollo from '@apollo/client';
import { Query } from './query';
import { QueryTemplate } from './defineQuery';
export declare const useQuery: <R, V>(query: Query<R, V>, options?: Apollo.QueryHookOptions<R, V> | undefined) => [R | undefined, Apollo.QueryResult<R, V>];
export declare type WrappedLazyQuery<V> = V extends null ? (variables?: null, options?: Apollo.QueryLazyOptions<V>) => void : (variables: V, options?: Apollo.QueryLazyOptions<V>) => void;
export declare const useLazyQuery: <R, V>(queryTemplate: QueryTemplate<R, V>, options?: Apollo.LazyQueryHookOptions<R, V> | undefined) => [WrappedLazyQuery<V>, R | undefined, Apollo.LazyQueryResult<R, V>];
