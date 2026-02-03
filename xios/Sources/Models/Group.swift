import Foundation

struct Group: Identifiable, Codable {
    let id: String
    let name: String
    let description: String?
    let isPrivate: Bool
    let type: String? // "dm" or "channel" based on backend logic
    // Add other fields as necessary
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case description
        case isPrivate
        case type
    }
}
