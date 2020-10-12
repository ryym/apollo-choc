import { DocumentNode } from 'graphql';
import { Query } from './query';
import { MutationTemplate } from './defineMutation';

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
export const defineQuery = <R, V = null>({
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
