import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    let groupId: String
    
    var body: some View {
        VStack {
            ScrollViewReader { proxy in
                List(viewModel.messages) { message in
                    MessageRow(message: message)
                        .id(message.id)
                }
                .onChange(of: viewModel.messages.count) { _ in
                    if let lastId = viewModel.messages.last?.id {
                        proxy.scrollTo(lastId, anchor: .bottom)
                    }
                }
            }
            
            HStack {
                TextField("Type a message...", text: $viewModel.newMessageText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: viewModel.sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 22))
                }
            }
            .padding()
        }
        .navigationTitle("Chat")
        .onAppear {
            viewModel.selectGroup(groupId: groupId)
        }
    }
}

struct MessageRow: View {
    let message: Message
    
    var body: some View {
        HStack(alignment: .top) {
            if let avatar = message.userAvatar, let url = URL(string: avatar) {
                 // In a real app, use AsyncImage or a caching library like Kingfisher
                 AsyncImage(url: url) { image in
                     image.resizable()
                 } placeholder: {
                     Circle().fill(Color.gray)
                 }
                 .frame(width: 40, height: 40)
                 .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 40, height: 40)
                    .overlay(Text(message.userName.prefix(1)).foregroundColor(.white))
            }
            
            VStack(alignment: .leading) {
                Text(message.userName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(message.content)
                    .padding(10)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
            }
        }
        .padding(.vertical, 4)
    }
}
