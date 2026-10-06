#import <Cordova/CDVPlugin.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface CustomDeeplinksPlugin : CDVPlugin

- (BOOL)handleUserActivity:(NSUserActivity *)userActivity;
- (void)clearPendingDeeplink:(CDVInvokedUrlCommand *)command;

@end
