import Foundation

struct Message: Identifiable, Codable {
    let id: String
    let groupId: String
    let userId: String
    let userName: String
    let userAvatar: String?
    let content: String
    let type: String
    let fileUrl: String?
    let fileName: String?
    let createdAt: String // Keeping as string for easy JSON parsing
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case groupId
        case userId
        case userName
        case userAvatar
        case content
        case type
        case fileUrl
        case fileName
        case createdAt
    }
}
