import SwiftUI

struct ContentView: View {
    @State private var token: String = ""
    @State private var isLoggedIn = false
    @State private var groupIdInput: String = "" // Placeholder for group selection
    
    var body: some View {
        NavigationView {
            if isLoggedIn {
                VStack {
                    Text("Connected to SignalDesk")
                        .font(.headline)
                    
                    TextField("Enter Group ID", text: $groupIdInput)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding()
                    
                    if !groupIdInput.isEmpty {
                        NavigationLink("Go to Chat", destination: ChatView(groupId: groupIdInput))
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    
                    Button("Disconnect") {
                        SocketService.shared.disconnect()
                        isLoggedIn = false
                    }
                    .padding()
                }
            } else {
                VStack {
                    Text("SignalDesk Login")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    TextField("Enter Auth Token", text: $token)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding()
                    
                    Button("Connect") {
                        SocketService.shared.connect(token: token)
                        // In a real app, listen to 'connect' event to set isLoggedIn
                        // For this demo, we assume success if token provided for logic flow
                        isLoggedIn = true 
                    }
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .disabled(token.isEmpty)
                }
                .padding()
            }
        }
    }
}
