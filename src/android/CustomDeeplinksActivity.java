package com.cordova.deeplinks.plugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import java.lang.reflect.Method;

public class CustomDeeplinksActivity extends Activity {

    private static final String TAG = "[CustomDeeplinksActivity]";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Intent incomingIntent = getIntent();
            Uri data = incomingIntent != null ? incomingIntent.getData() : null;

            if (data != null) {
                Log.d(TAG, "Received deep link: " + data.toString());
            } else {
                Log.w(TAG, "Received intent with no data");
            }

            boolean hasAppsFlyer = notifyAppsFlyerIfPresent(incomingIntent);

            Context context = this;
            String packageName = context.getPackageName();
            Class<?> mainActivityClass = Class.forName(packageName + ".MainActivity");
            Intent launchIntent = new Intent(this, mainActivityClass);

            int resId = getResources().getIdentifier("ENABLE_APPSFLYER_DEEEPLINKS", "string", getPackageName());
            String prefValue = resId != 0 ? getString(resId) : "false";
            boolean enableAppsFlyerDeeplinks = Boolean.parseBoolean(prefValue);

            if (hasAppsFlyer && incomingIntent != null && enableAppsFlyerDeeplinks) {
                launchIntent.setAction(incomingIntent.getAction());
                launchIntent.setData(incomingIntent.getData());
                if (incomingIntent.getExtras() != null) {
                    launchIntent.putExtras(incomingIntent.getExtras());
                }
            } else {
                launchIntent.setAction(Intent.ACTION_MAIN);
                launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            }

            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            if (data != null) {
                launchIntent.putExtra("deeplink_url", data.toString());
            }

            startActivity(launchIntent);
        } catch (Exception e) {
            Log.e(TAG, "Error handling deep link intent", e);
        } finally {
            finish();
        }
    }

    private boolean notifyAppsFlyerIfPresent(Intent intent) {
        if (intent == null) return false;
        try {
            Class<?> cls = Class.forName("com.appsflyer.AppsFlyerLib");
            Method getInstance = cls.getMethod("getInstance");
            Object af = getInstance.invoke(null);
            Method perform = cls.getMethod("performOnDeepLinking", Intent.class, Context.class);
            perform.invoke(af, intent, this);
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        } catch (Throwable t) {
            Log.w(TAG, "AppsFlyer present but performOnDeepLinking failed", t);
            return true;
        }
    }
}
