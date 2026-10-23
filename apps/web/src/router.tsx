import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './layouts/AppLayout/AppLayout.tsx'
import { DEFAULT_PATH, NAV_GROUPS } from './navigation.ts'
import { PlaceholderPage } from './pages/PlaceholderPage/PlaceholderPage.tsx'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_PATH} replace /> },
      // 메뉴별 페이지가 생기기 전까지는 자리 표시 페이지를 쓴다.
      ...NAV_GROUPS.flatMap((group) => group.items).map((item) => ({
        path: item.path,
        element: <PlaceholderPage />,
      })),
      { path: '*', element: <Navigate to={DEFAULT_PATH} replace /> },
    ],
  },
])
