/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEuiTheme, useIsWithinBreakpoints } from '@elastic/eui';
import {
  ResizableLayout,
  ResizableLayoutDirection,
  ResizableLayoutMode,
} from '@kbn/resizable-layout';
import type { UnifiedFieldListSidebarContainerApi } from '@kbn/unified-field-list';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { createHtmlPortalNode, InPortal, OutPortal } from 'react-reverse-portal';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import useObservable from 'react-use/lib/useObservable';
import { of } from 'rxjs';

export const SIDEBAR_WIDTH_KEY = 'timeline:sidebarWidth';

export const TimelineResizableLayoutComponent = ({
  container,
  sidebarPanel,
  mainPanel,
  unifiedFieldListSidebarContainerApi,
}: {
  container: HTMLElement | null;
  sidebarPanel: ReactNode;
  mainPanel: ReactNode;
  unifiedFieldListSidebarContainerApi: UnifiedFieldListSidebarContainerApi | null;
}) => {
  const [sidebarPanelNode] = useState(() =>
    createHtmlPortalNode({ attributes: { class: 'eui-fullHeight' } })
  );
  const [mainPanelNode] = useState(() =>
    createHtmlPortalNode({ attributes: { class: 'eui-fullHeight' } })
  );

  const { euiTheme } = useEuiTheme();
  const minSidebarWidth = euiTheme.base * 13;
  const defaultSidebarWidth = euiTheme.base * 19;
  const minMainPanelWidth = euiTheme.base * 30;

  const [sidebarWidth, setSidebarWidth] = useLocalStorage(SIDEBAR_WIDTH_KEY, defaultSidebarWidth);

  const isMobile = useIsWithinBreakpoints(['xs', 's']);

  const isSidebarCollapsed = useObservable(
    unifiedFieldListSidebarContainerApi?.isSidebarCollapsed$ ?? of(true),
    true
  );
  const layoutMode =
    isMobile || isSidebarCollapsed ? ResizableLayoutMode.Static : ResizableLayoutMode.Resizable;
  const layoutDirection = isMobile
    ? ResizableLayoutDirection.Vertical
    : ResizableLayoutDirection.Horizontal;

  return (
    <>
      <InPortal node={sidebarPanelNode}>{sidebarPanel}</InPortal>
      <InPortal node={mainPanelNode}>{mainPanel}</InPortal>
      <ResizableLayout
        className="dscPageBody__contents"
        mode={layoutMode}
        direction={layoutDirection}
        container={container}
        fixedPanelSize={sidebarWidth ?? defaultSidebarWidth}
        minFixedPanelSize={minSidebarWidth}
        minFlexPanelSize={minMainPanelWidth}
        fixedPanel={<OutPortal node={sidebarPanelNode} />}
        flexPanel={<OutPortal node={mainPanelNode} />}
        resizeButtonClassName="dscSidebarResizeButton"
        data-test-subj="discoverLayout"
        onFixedPanelSizeChange={setSidebarWidth}
      />
    </>
  );
};

export const TimelineResizableLayout = React.memo(TimelineResizableLayoutComponent);
// eslint-disable-next-line import/no-default-export
export { TimelineResizableLayout as default };
