import type * as Apollo from '@apollo/client';
import { Mutation, MutationTemplate } from './defineMutation';
export declare const useMutation: <R, V = null, IP = null>({ mutation, invalidations }: MutationTemplate<R, V, IP>, options?: Apollo.MutationHookOptions<R, V> | undefined) => [Mutation<R, V, IP>, Apollo.MutationResult<R>];
