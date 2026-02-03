import Foundation
import Combine
// IMPORTANT: You must add the 'SocketIO' package to your project.
// Url: https://github.com/socketio/socket.io-client-swift
import SocketIO

class SocketService: ObservableObject {
    static let shared = SocketService()
    
    private var manager: SocketManager?
    private var socket: SocketIOClient?
    
    @Published var isConnected = false
    @Published var messages: [Message] = []
    @Published var currentGroupMessages: [String: [Message]] = [:] // GroupId -> Messages
    
    private init() {}
    
    func connect(token: String) {
        // Replace with your actual backend URL
        let url = URL(string: "http://localhost:3001")! 
        
        manager = SocketManager(socketURL: url, config: [
            .log(true),
            .compress,
            .connectParams(["token": token]),
            .extraHeaders(["Authorization": "Bearer \(token)"]) // Some backends might need this
        ])
        
        socket = manager?.defaultSocket
        
        setupListeners()
        socket?.connect()
    }
    
    func disconnect() {
        socket?.disconnect()
    }
    
    private func setupListeners() {
        guard let socket = socket else { return }
        
        socket.on(clientEvent: .connect) { [weak self] _, _ in
            print("Socket connected")
            DispatchQueue.main.async {
                self?.isConnected = true
            }
        }
        
        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            print("Socket disconnected")
            DispatchQueue.main.async {
                self?.isConnected = false
            }
        }
        
        socket.on("new-message") { [weak self] data, _ in
            guard let self = self,
                  let dict = data[0] as? [String: Any] else { return }
            
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: dict)
                let message = try JSONDecoder().decode(Message.self, from: jsonData)
                
                DispatchQueue.main.async {
                    var msgs = self.currentGroupMessages[message.groupId] ?? []
                    msgs.append(message)
                    self.currentGroupMessages[message.groupId] = msgs
                    self.messages.append(message) // For global list if needed
                }
            } catch {
                print("Error decoding message: \(error)")
            }
        }
        
        // Add other listeners here (e.g., user-typing, notification)
    }
    
    func joinGroup(groupId: String) {
        socket?.emit("join-group", ["groupId": groupId])
    }
    
    func leaveGroup(groupId: String) {
        socket?.emit("leave-group", ["groupId": groupId])
    }
    
    func sendMessage(groupId: String, content: String, type: String = "text") {
        let payload: [String: Any] = [
            "groupId": groupId,
            "content": content,
            "type": type
        ]
        socket?.emit("send-message", payload)
    }
    
    func sendTyping(groupId: String, isTyping: Bool) {
        socket?.emit("typing", ["groupId": groupId, "isTyping": isTyping])
    }
}
