import { DocumentNode } from 'graphql';
import { Query } from './query';
import { MutationTemplate } from './defineMutation';
export declare type QueryTemplate<R, V> = V extends null ? () => Query<R, V> : (v: V) => Query<R, V>;
export interface QueryConfig<V> {
    query: DocumentNode;
    invalidates?: (on: InvalidatesOn<V>) => InvalidationConfig<any, any, V>[];
}
export declare type InvalidatesOn<QV> = QV extends null ? <MV, IP>(mut: MutationTemplate<any, MV, IP>) => InvalidationConfig<MV, IP, never> : <MV, IP>(mut: MutationTemplate<any, MV, IP>, createVariables: (mutVar: MV, invParams: IP) => QV) => InvalidationConfig<MV, IP, QV>;
export interface InvalidationConfig<V, IP, QV> {
    mutation: MutationTemplate<any, any>;
    queryVariables?: (mutVar: V, invParams: IP) => QV;
}
export declare const defineQuery: <R, V = null>({ query, invalidates, }: QueryConfig<V>) => QueryTemplate<R, V>;
