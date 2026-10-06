#import "CustomDeeplinksPlugin.h"

@implementation CustomDeeplinksPlugin

static NSString *pendingURL = nil;

- (NSString *)safeJsonString:(NSString *)input {
    if (input == nil) return @"\"\"";
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:@[input] options:0 error:&error];
    if (!jsonData) {
        return @"\"\"";
    }
    NSString *jsonArrayString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    if (jsonArrayString.length >= 2) {
        return [jsonArrayString substringWithRange:NSMakeRange(1, jsonArrayString.length - 2)];
    }
    return @"\"\"";
}

- (void)pluginInitialize {
    if (pendingURL != nil) {
        NSString *safeURLJson = [self safeJsonString:pendingURL];
        NSString *js = [NSString stringWithFormat:@"window.CustomDeeplinks && window.CustomDeeplinks.onDeepLink && window.CustomDeeplinks.onDeepLink(%@);", safeURLJson];
        [self.commandDelegate evalJs:js];
        NSLog(@"[CustomDeeplinks] Fire pending universal link: %@", pendingURL);
        pendingURL = nil;
    }
}

- (BOOL)handleUserActivity:(NSUserActivity *)userActivity {
    if (userActivity.webpageURL == nil) return NO;

    NSString *urlString = userActivity.webpageURL.absoluteString;
    NSLog(@"[CustomDeeplinks] Handling universal link: %@", urlString);

    pendingURL = urlString;

    if (self.webViewEngine && self.webViewEngine.engineWebView) {
        NSString *safeURLJson = [self safeJsonString:urlString];
        NSString *js = [NSString stringWithFormat:@"window.CustomDeeplinks && window.CustomDeeplinks.onDeepLink && window.CustomDeeplinks.onDeepLink(%@);", safeURLJson];
        [self.commandDelegate evalJs:js];
        NSLog(@"[CustomDeeplinks] Fire universal link immediately: %@", urlString);
    }

    return YES;
}


- (void)getPendingDeeplink:(CDVInvokedUrlCommand *)command {
    if (pendingURL != nil) {
        NSLog(@"[CustomDeeplinks] Returning pending URL: %@", pendingURL);
        
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:pendingURL];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];

        pendingURL = nil;
    } else {
        NSLog(@"[CustomDeeplinks] No pending URL");
        
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
}

- (void)clearPendingDeeplink:(CDVInvokedUrlCommand *)command {
    NSLog(@"[CustomDeeplinks] Clearing pending URL via JS acknowledgment");
    pendingURL = nil;
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

@end
