package com.cordova.deeplinks.plugin;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;

public class CustomDeeplinksPlugin extends CordovaPlugin {

    private static final String TAG = "[CustomDeeplinks]";
    private static String pendingURL = null;

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "Plugin initialized");
    
        Intent intent = cordova.getActivity().getIntent();
        String url = intent.getStringExtra("deeplink_url");
    
        if (url == null && intent.getData() != null) {
            url = intent.getData().toString();
        }
    
        if (url != null) {
            pendingURL = url;
            Log.d(TAG, "Detected cold start with URL: " + pendingURL);
        }
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("getPendingDeeplink".equals(action)) {
            if (pendingURL != null) {
                Log.d(TAG, "Returning pending URL: " + pendingURL);
                callbackContext.success(pendingURL);
                pendingURL = null;
            } else {
                Log.d(TAG, "No pending URL");
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.NO_RESULT));
            }
            return true;
        } else if ("clearPendingDeeplink".equals(action)) {
            pendingURL = null;
            callbackContext.success();
            return true;
        }

        return false;
    }

@Override
public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);

    if (intent == null) return;

    String url = null;
    if (intent.hasExtra("deeplink_url")) {
        url = intent.getStringExtra("deeplink_url");
        Log.d(TAG, "Received deeplink from extra: " + url);
    }
    if (url == null && intent.getData() != null) {
        url = intent.getData().toString();
        Log.d(TAG, "Received deeplink from data: " + url);
    }
    if (url != null) {
        pendingURL = url;
        fireDeepLinkToJS(url);
    } else {
        Log.d(TAG, "No URL found in intent");
    }
}

    private void fireDeepLinkToJS(String url) {
        if (webView != null) {
            // Encode the string safely as a JSON string literal (handles backslashes, quotes, and wraps in quotes)
            String safeUrlJson = org.json.JSONObject.quote(url);
            String js = "window.CustomDeeplinks && window.CustomDeeplinks.onDeepLink && window.CustomDeeplinks.onDeepLink(" + safeUrlJson + ");";
            webView.getEngine().evaluateJavascript(js, null);
            Log.d(TAG, "Dispatched JS event with URL: " + url);
        } else {
            Log.w(TAG, "WebView is null, cannot dispatch deep link");
        }
    }
}

