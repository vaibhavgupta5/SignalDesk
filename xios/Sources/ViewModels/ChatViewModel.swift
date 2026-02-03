import Foundation
import Combine

class ChatViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var newMessageText: String = ""
    @Published var currentGroupId: String?
    
    private var cancellables = Set<AnyCancellable>()
    private let socketService = SocketService.shared
    
    init() {
        // Subscribe to socket messages
        socketService.$currentGroupMessages
            .sink { [weak self] allMessages in
                guard let self = self, let groupId = self.currentGroupId else { return }
                self.messages = allMessages[groupId] ?? []
            }
            .store(in: &cancellables)
    }
    
    func selectGroup(groupId: String) {
        if let oldGroup = currentGroupId {
            socketService.leaveGroup(groupId: oldGroup)
        }
        currentGroupId = groupId
        socketService.joinGroup(groupId: groupId) // This triggers the join event
        // Ideally fetch historical messages via REST API here, then listen for new ones via socket
    }
    
    func sendMessage() {
        guard !newMessageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let groupId = currentGroupId else { return }
        
        socketService.sendMessage(groupId: groupId, content: newMessageText)
        newMessageText = ""
    }
}
