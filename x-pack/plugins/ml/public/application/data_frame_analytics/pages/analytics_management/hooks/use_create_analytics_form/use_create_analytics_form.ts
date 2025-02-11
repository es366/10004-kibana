/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useReducer } from 'react';

import { i18n } from '@kbn/i18n';

import { extractErrorMessage } from '@kbn/ml-error-utils';
import { extractErrorProperties } from '@kbn/ml-error-utils';
import type { DataFrameAnalyticsConfig } from '@kbn/ml-data-frame-analytics-utils';

import { useMlKibana } from '../../../../../contexts/kibana';
import { DeepReadonly } from '../../../../../../../common/types/common';
import { ml } from '../../../../../services/ml_api_service';

import { useRefreshAnalyticsList } from '../../../../common';
import { extractCloningConfig, isAdvancedConfig } from '../../components/action_clone';

import { ActionDispatchers, ACTION } from './actions';
import { reducer } from './reducer';
import {
  getInitialState,
  getJobConfigFromFormState,
  FormMessage,
  State,
  SourceIndexMap,
  getFormStateFromJobConfig,
} from './state';

import { ANALYTICS_STEPS } from '../../../analytics_creation/page';

export interface AnalyticsCreationStep {
  number: ANALYTICS_STEPS;
  completed: boolean;
}

export interface CreateAnalyticsFormProps {
  actions: ActionDispatchers;
  state: State;
}

export interface CreateAnalyticsStepProps extends CreateAnalyticsFormProps {
  setCurrentStep: React.Dispatch<React.SetStateAction<ANALYTICS_STEPS>>;
  step?: ANALYTICS_STEPS;
  stepActivated?: boolean;
}

export const useCreateAnalyticsForm = (): CreateAnalyticsFormProps => {
  const {
    services: {
      data: { dataViews },
    },
  } = useMlKibana();
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const { refresh } = useRefreshAnalyticsList();

  const { form, jobConfig, isAdvancedEditorEnabled } = state;
  const { createDataView, jobId } = form;

  const addRequestMessage = (requestMessage: FormMessage) =>
    dispatch({ type: ACTION.ADD_REQUEST_MESSAGE, requestMessage });

  const closeModal = () => dispatch({ type: ACTION.CLOSE_MODAL });

  const resetAdvancedEditorMessages = () =>
    dispatch({ type: ACTION.RESET_ADVANCED_EDITOR_MESSAGES });

  const setAdvancedEditorRawString = (advancedEditorRawString: string) =>
    dispatch({ type: ACTION.SET_ADVANCED_EDITOR_RAW_STRING, advancedEditorRawString });

  const setDataViewTitles = (payload: { dataViewsMap: SourceIndexMap }) =>
    dispatch({ type: ACTION.SET_DATA_VIEW_TITLES, payload });

  const setIsJobCreated = (isJobCreated: boolean) =>
    dispatch({ type: ACTION.SET_IS_JOB_CREATED, isJobCreated });

  const setIsJobStarted = (isJobStarted: boolean) => {
    dispatch({ type: ACTION.SET_IS_JOB_STARTED, isJobStarted });
  };

  const resetRequestMessages = () => dispatch({ type: ACTION.RESET_REQUEST_MESSAGES });

  const resetForm = () => dispatch({ type: ACTION.RESET_FORM });

  const createAnalyticsJob = async () => {
    resetRequestMessages();

    const analyticsJobConfig = (
      isAdvancedEditorEnabled ? jobConfig : getJobConfigFromFormState(form)
    ) as DataFrameAnalyticsConfig;
    const errorMessage = i18n.translate(
      'xpack.ml.dataframe.analytics.create.errorCreatingDataFrameAnalyticsJob',
      {
        defaultMessage: 'An error occurred creating the data frame analytics job:',
      }
    );

    try {
      const creationResp = await ml.dataFrameAnalytics.createDataFrameAnalytics(
        jobId,
        analyticsJobConfig,
        createDataView,
        form.timeFieldName
      );

      addRequestMessage({
        message: i18n.translate(
          'xpack.ml.dataframe.stepCreateForm.createDataFrameAnalyticsSuccessMessage',
          {
            defaultMessage: 'Request to create data frame analytics {jobId} acknowledged.',
            values: { jobId },
          }
        ),
      });

      if (
        creationResp.dataFrameAnalyticsJobsCreated.length &&
        creationResp.dataFrameAnalyticsJobsErrors.length === 0
      ) {
        setIsJobCreated(true);
        refresh();
        return true;
      } else if (creationResp.dataFrameAnalyticsJobsErrors.length) {
        addRequestMessage({
          error: extractErrorProperties(creationResp.dataFrameAnalyticsJobsErrors[0].error).message,
          message: errorMessage,
        });
        return false;
      }
    } catch (e) {
      addRequestMessage({
        error: extractErrorMessage(e),
        message: errorMessage,
      });
      return false;
    }
    return false;
  };

  const prepareFormValidation = async () => {
    try {
      // Set the existing data view names.
      const dataViewsMap: SourceIndexMap = {};
      const savedObjects = (await dataViews.getCache()) || [];
      savedObjects.forEach((obj) => {
        const title = obj?.attributes?.title;
        if (title !== undefined) {
          const id = obj?.id || '';
          dataViewsMap[title] = { label: title, value: id };
        }
      });
      setDataViewTitles({
        dataViewsMap,
      });
    } catch (e) {
      addRequestMessage({
        error: extractErrorMessage(e),
        message: i18n.translate('xpack.ml.dataframe.analytics.create.errorGettingDataViewNames', {
          defaultMessage: 'An error occurred getting the existing data view names:',
        }),
      });
    }
  };

  const initiateWizard = async () => {
    await dataViews.clearCache();
    await prepareFormValidation();
  };

  const startAnalyticsJob = async () => {
    try {
      const response = await ml.dataFrameAnalytics.startDataFrameAnalytics(jobId);
      if (response.acknowledged !== true) {
        throw new Error(response);
      }
      addRequestMessage({
        message: i18n.translate(
          'xpack.ml.dataframe.analytics.create.startDataFrameAnalyticsSuccessMessage',
          {
            defaultMessage: 'Request to start data frame analytics {jobId} acknowledged.',
            values: { jobId },
          }
        ),
      });
      setIsJobStarted(true);
      refresh();
    } catch (e) {
      addRequestMessage({
        error: extractErrorMessage(e),
        message: i18n.translate(
          'xpack.ml.dataframe.analytics.create.errorStartingDataFrameAnalyticsJob',
          {
            defaultMessage: 'An error occurred starting the data frame analytics job:',
          }
        ),
      });
    }
  };

  const setJobConfig = (payload: Record<string, any>) => {
    dispatch({ type: ACTION.SET_JOB_CONFIG, payload });
  };

  const setFormState = (payload: Partial<State['form']>) => {
    dispatch({ type: ACTION.SET_FORM_STATE, payload });
  };

  const switchToAdvancedEditor = () => {
    dispatch({ type: ACTION.SWITCH_TO_ADVANCED_EDITOR });
  };

  const switchToForm = () => {
    dispatch({ type: ACTION.SWITCH_TO_FORM });
  };

  const setEstimatedModelMemoryLimit = (value: State['estimatedModelMemoryLimit'] | undefined) => {
    dispatch({ type: ACTION.SET_ESTIMATED_MODEL_MEMORY_LIMIT, value: value ?? '' });
  };

  const setJobClone = async (cloneJob: DeepReadonly<DataFrameAnalyticsConfig>) => {
    resetForm();
    const config = extractCloningConfig(cloneJob);
    if (isAdvancedConfig(config)) {
      setFormState(getFormStateFromJobConfig(config));
      switchToAdvancedEditor();
    } else {
      setFormState(getFormStateFromJobConfig(config));
      setEstimatedModelMemoryLimit(config.model_memory_limit);
    }

    dispatch({ type: ACTION.SET_JOB_CLONE, cloneJob });
  };

  const actions: ActionDispatchers = {
    closeModal,
    createAnalyticsJob,
    initiateWizard,
    resetAdvancedEditorMessages,
    setAdvancedEditorRawString,
    setFormState,
    setJobConfig,
    startAnalyticsJob,
    switchToAdvancedEditor,
    switchToForm,
    setEstimatedModelMemoryLimit,
    setJobClone,
  };

  return { state, actions };
};
