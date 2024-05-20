import { useQuery } from "@apollo/client";
import { getApolloAuthClient, useAuth } from "@faustwp/core";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  updateViewer as updateViewerToStore,
  removeAll as removeAllViewerDataFromStore,
  updateAuthorizedUser,
} from "@/stores/viewer/viewerSlice";
import { updateGeneralSettings } from "@/stores/general-settings/generalSettingsSlice";
import useInitGetAndUpdateViewerReactionPosts from "@/hooks/useInitGetAndUpdateViewerReactionPosts";
import { GET_SITE_VIEWER } from "@/fragments/queries";
import ControlSettingsDemo from "./ControlSettingsDemo";
import CookiestBoxPopover from "@/components/CookiestBoxPopover";
import errorHandling from "@/utils/errorHandling";
import MusicPlayer from "@/components/MusicPlayer/MusicPlayer";
import { initLocalPostsSavedListFromLocalstored } from "@/stores/localPostSavedList/localPostsSavedListSlice";
import { usePathname } from "next/navigation";

export function SiteWrapperChild({
  ...props
}: {
  __TEMPLATE_QUERY_DATA__: any;
}) {
  const client = getApolloAuthClient();
  const { isAuthenticated, isReady, loginUrl } = useAuth();
  const dispatch = useDispatch();
  const [refetchTimes, setRefetchTimes] = useState(0);
  const pathname = usePathname();

  // init get and update viewer reaction posts
  useInitGetAndUpdateViewerReactionPosts();

  // useLazyQuery get viewer data
  const { refetch } = useQuery(GET_SITE_VIEWER, {
    client,
    skip: !isAuthenticated,
    context: {
      fetchOptions: {
        method: process.env.NEXT_PUBLIC_SITE_API_METHOD || "GET",
      },
    },
    onCompleted: (data) => {
      // check is dev mode and log viewer data
      if (data?.viewer?.databaseId) {
        dispatch(updateViewerToStore(data?.viewer));
      } else {
        dispatch(removeAllViewerDataFromStore());
      }
    },
    onError: (error) => {
      console.log(123, "🎈 __________get_viewer_error____", error);
      if (refetchTimes > 3) {
        errorHandling(error);
        return;
      }
      setRefetchTimes(refetchTimes + 1);
      refetch();
    },
  });

  // update general settings to store
  useEffect(() => {
    const generalSettings =
      props?.__TEMPLATE_QUERY_DATA__?.generalSettings ?? {};
    dispatch(updateGeneralSettings(generalSettings));
  }, []);

  useEffect(() => {
    const initialStateLocalSavedPosts: number[] = JSON.parse(
      typeof window !== "undefined"
        ? localStorage?.getItem("localSavedPosts") || "[]"
        : "[]"
    );
    dispatch(
      initLocalPostsSavedListFromLocalstored(initialStateLocalSavedPosts)
    );
  }, []);

  // update updateAuthorizedUser to store
  useEffect(() => {
    dispatch(
      updateAuthorizedUser({
        isAuthenticated,
        isReady,
        loginUrl,
      })
    );
  }, [isAuthenticated]);

  if (pathname?.startsWith("/ncmaz_for_ncmazfc_preview_blocks")) {
    return null;
  }

  return (
    <div>
      <CookiestBoxPopover />
      <ControlSettingsDemo />
      <MusicPlayer />
    </div>
  );
}
