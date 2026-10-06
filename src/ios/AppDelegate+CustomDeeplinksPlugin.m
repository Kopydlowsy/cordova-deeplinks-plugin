#import "AppDelegate+CustomDeeplinksPlugin.h"
#import "CustomDeeplinksPlugin.h"

@implementation AppDelegate (CustomDeeplinksPlugin)

// cordova-ios 7+ uses the Scene-based app lifecycle by default. In that mode, iOS calls
// -scene:continueUserActivity: on CDVSceneDelegate, NOT -application:continueUserActivity:
// on AppDelegate below - so that method is never invoked and Universal Links are silently
// dropped. CDVSceneDelegate instead posts CDVPluginContinueUserActivityNotification, so we
// listen for that too. +load runs for every category unconditionally (unlike normal methods,
// which categories can silently shadow), making it the safe place to register this.
+ (void)load {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(cdv_customDeeplinks_handleContinueUserActivityNotification:)
                                                  name:CDVPluginContinueUserActivityNotification
                                                object:nil];
}

+ (void)cdv_customDeeplinks_handleContinueUserActivityNotification:(NSNotification *)notification {
    NSUserActivity *userActivity = notification.object;
    AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
    [appDelegate cdv_customDeeplinks_handleUniversalLink:userActivity];
}

// Universal Link handler (legacy, pre-Scene app lifecycle)
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
restorationHandler:(void (^)(NSArray *))restorationHandler {
    return [self cdv_customDeeplinks_handleUniversalLink:userActivity];
}

- (BOOL)cdv_customDeeplinks_handleUniversalLink:(NSUserActivity *)userActivity {
    NSLog(@"[CustomDeeplinks] First click");

    if (![userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb] || userActivity.webpageURL == nil) {
        NSLog(@"[CustomDeeplinks] Invalid URL");
        return NO;
    }

    CustomDeeplinksPlugin *plugin = [self.viewController getCommandInstance:@"CustomDeeplinks"];
    if (plugin == nil) {
        NSLog(@"[Deeplinks] Plugin not found");
    }

    NSLog(@"[CustomDeeplinks] URL: %@", userActivity.webpageURL.absoluteString);

    BOOL handled = [plugin handleUserActivity:userActivity];

    NSLog(@"[CustomDeeplinks] handleUserActivity result: %@", handled ? @"YES" : @"NO");

    return handled;
}

// Deep link (URL scheme) handler
- (BOOL)application:(UIApplication *)app 
            openURL:(NSURL *)url 
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

    NSLog(@"[CustomDeeplinks] App opened via URL scheme: %@", url.absoluteString);

    return YES;
}

@end
