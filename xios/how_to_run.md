# How to Run SignalDesk iOS (Swift)

Since this is a native iOS/macOS implementation, you need **Xcode** (on a Mac) to run it.

## Prerequisites

1.  **Mac with Xcode Installed**: Ensure you have Xcode 14 or newer.
2.  **This Code**: You should have this `xios` folder on your Mac.
3.  **Backend Server**: Your Next.js/Node backend (`backend-socket`) must be running.

---

## Method 1: The "Drag & Drop" Way (Recommended for App Building)

This method creates a full-fledged iOS application where you can build your UI visually and run it on a Simulator or Device.

1.  **Create a New Project**:
    - Open Xcode.
    - Select **Create a new Xcode project**.
    - Choose **iOS** -> **App**.
    - Name it `SignalDesk` (or whatever you like).
    - Interface: **SwiftUI**.
    - Language: **Swift**.

2.  **Add Dependencies**:
    - In Xcode, go to **File > Add Package Dependencies...**
    - Paste this URL into the search bar: `https://github.com/socketio/socket.io-client-swift`
    - Click **Add Package**.

3.  **Import the Code**:
    - In your new Xcode project navigator (left sidebar), Delete the default `ContentView.swift` (move to trash).
    - Right-click on the yellow folder (your project group) and select **Add Files to "SignalDesk"...**
    - Navigate to this `xios/Sources` folder and select the folders: `Models`, `Services`, `ViewModels`, `Views`.
    - **Important**: Check the box "Copy items if needed" so the files are copied into your actual project.

4.  **Update Entry Point**:
    - Locate your App file (usually named `SignalDeskApp.swift`).
    - Ensure the `WindowGroup` loads `ContentView()`:

    ```swift
    import SwiftUI

    @main
    struct SignalDeskApp: App {
        var body: some Scene {
            WindowGroup {
                ContentView()
            }
        }
    }
    ```

5.  **Connect to Backend**:
    - Open `Services/SocketService.swift`.
    - Find the line: `let url = URL(string: "http://localhost:3001")!`
    - **If using Simulator**: You might need to change `localhost` to your computer's local IP address (e.g., `http://192.168.1.50:3001`) because "localhost" on a phone refers to the phone itself.
    - **If using Real Device**: You MUST use your computer's local IP address.

6.  **Run**:
    - Select a Simulator (message "iPhone 15") in the top bar.
    - Press the **Play** button (CMD + R).

---

## Method 2: Open as Swift Package (Quick View)

If you just want to browse the code and verify it compiles without setting up a full app:

1.  Locate the file `Package.swift` inside this `xios` folder.
2.  Double-click `Package.swift`.
3.  Xcode will open it as a "Package" project and automatically download the Socket.IO dependency.
4.  You can browse files, but you cannot "Run" the app interface easily without creating a standard Xcode Project (Method 1).

---

## Troubleshooting

- **Connection Error**: If the app doesn't connect, check:
  1.  Is your backend running? (`npm run dev` or `node server.js` in the `backend-socket` folder).
  2.  Check the IP address in `SocketService.swift`.
  3.  Ensure your backend allows CORS from the mobile app (or allow `*`).
- **Build Errors**: If Xcode complains about missing module `SocketIO`, try **File > Packages > Reset Package Caches**.
