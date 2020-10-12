import { DocumentNode } from 'graphql';

export interface Query<Result, Variables> {
  readonly __ghost?: Result;
  readonly query: DocumentNode;
  readonly variables: Variables;
}
