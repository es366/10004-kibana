/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';
import React from 'react';
import { CspBenchmarkRule } from '../../../common/types/latest';
import { getFindingsDetectionRuleSearchTags } from '../../../common/utils/detection_rules';
import { DetectionRuleCounter } from '../../components/detection_rule_counter';
import { createDetectionRuleFromBenchmark } from '../configurations/utils/create_detection_rule_from_benchmark';

export const RulesDetectionRuleCounter = ({
  benchmarkRule,
}: {
  benchmarkRule: CspBenchmarkRule['metadata'];
}) => {
  const createBenchmarkRuleFn = async (http: HttpSetup) =>
    await createDetectionRuleFromBenchmark(http, benchmarkRule);

  return (
    <DetectionRuleCounter
      tags={getFindingsDetectionRuleSearchTags(benchmarkRule)}
      createRuleFn={createBenchmarkRuleFn}
    />
  );
};
