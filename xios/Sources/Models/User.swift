import Foundation

struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let avatar: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case email
        case avatar
    }
}
