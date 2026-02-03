# SignalDesk iOS Port

This folder contains the Swift source code to run SignalDesk natively on iOS/macOS using Xcode.

## Directory Structure

- `Sources/Models`: Data models (User, Message, Group).
- `Sources/Services`: SocketService handling Socket.IO connections.
- `Sources/ViewModels`: Logic for Chat and App state.
- `Sources/Views`: SwiftUI Views (ContentView, ChatView).

## How to Run in Xcode

### Option 1: Open as a Swift Package (Quick View)

1. Double-click `Package.swift` to open the folder in Xcode.
2. Xcode will resolve dependencies (Socket.IO client).
3. Note: You cannot "run" the app directly as a simulator app from a Package without potential configuration changes, but you can build the library.

### Option 2: Create a Fresh iOS App (Recommended)

1. Open Xcode and create a new **iOS App** project.
2. Select "SwiftUI" for the Interface.
3. Add the **Socket.IO-Client-Swift** dependency:
   - Go to `File > Add Package Dependencies...`
   - Enter `https://github.com/socketio/socket.io-client-swift` and add it.
4. Copy the contents of `Sources` into your new Xcode project's main group.
5. In your `App` struct (e.g., `SignalDeskApp.swift`), set the main view to `ContentView()`:

```swift
@main
struct SignalDeskApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

## Configuration

- Update the socket URL in `Sources/Services/SocketService.swift`:
  ```swift
  let url = URL(string: "http://YOUR_SERVER_IP:3001")!
  ```
- Ensure your backend `socket.io` server allows connections from your device/simulator IP (check CORs settings in `backend-socket/server.js`).

## Requirements

- Xcode 14+
- iOS 16+
