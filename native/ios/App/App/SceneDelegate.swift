import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = BittertalenBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

final class BittertalenBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(BittertalenHapticsPlugin())
    }
}

@objc(BittertalenHapticsPlugin)
final class BittertalenHapticsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "BittertalenHapticsPlugin"
    let jsName = "BittertalenHaptics"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise)
    ]

    @objc func play(_ call: CAPPluginCall) {
        let kind = call.getString("kind")
        DispatchQueue.main.async {
            switch kind {
            case "good":
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case "bad":
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            case "tick":
                UISelectionFeedbackGenerator().selectionChanged()
            default:
                call.reject("Unknown haptic feedback kind")
                return
            }
            call.resolve()
        }
    }
}
