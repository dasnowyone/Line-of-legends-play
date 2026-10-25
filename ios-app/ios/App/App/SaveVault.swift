import Capacitor
import Security
import UIKit

// Keeps a copy of the game's save in the iPhone keychain. Keychain items stay when the app is deleted and come back
// with an iPhone backup, so bought gems survive a reinstall. No iCloud setup or extra Apple permissions needed.
@objc(SaveVaultPlugin)
public class SaveVaultPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SaveVaultPlugin"
    public let jsName = "SaveVault"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
    ]
    private let service = "com.dasnowyone.lineoflegends.save"

    private func query(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key]
    }

    @objc func get(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? "save"
        var q = query(key)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        let status = SecItemCopyMatching(q as CFDictionary, &out)
        if status == errSecSuccess, let data = out as? Data, let text = String(data: data, encoding: .utf8) {
            call.resolve(["value": text])
        } else {
            call.resolve(["value": NSNull()])
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? "save"
        guard let value = call.getString("value"), let data = value.data(using: .utf8) else { return call.reject("value missing") }
        let q = query(key)
        let attrs: [String: Any] = [kSecValueData as String: data, kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock]
        var status = SecItemUpdate(q as CFDictionary, attrs as CFDictionary)
        if status == errSecItemNotFound { status = SecItemAdd(q.merging(attrs) { $1 } as CFDictionary, nil) }
        if status == errSecSuccess { call.resolve() } else { call.reject("keychain error \(status)") }
    }
}

// The app's web view controller: Capacitor's own, plus the save vault above
class GameViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SaveVaultPlugin())
    }
}
