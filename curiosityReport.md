Really cool tutorial: https://developer.apple.com/videos/play/wwdc2024/10195/
# Swift Testing
## How to Start
1. `import Testing`
2. use macro `@testable` with `import` to import the target I want to test:
`@testable import [name of target]`
3. create a `struct`
```swift
struct my_unitTests {
	
}
```
4. Insert tests
```swift
@Test("adding 2 numbers") func add() {
	#expect(calculator.add(1, 2) == 3)
}
```

### The `#expect` Macro
This is how we test or assert a specific parameter. `expect` takes as parameter a boolean expression. This is the main way of writing tests in `Swift Testing`
```swift
#expect(name == "Max")
#expect(array.contains(5))
#expect(someOptional != nil)
```
### `#require` Macro
The purpose of this macro is to make sure a boolean is true, and if is not, then we **stop the test**.
```swift
#require(data.count > 0)
#expect(data[0] == 42) // This only runs if the above passes
```

#### Another example using `try #require`:
```swift
@Test func fullName() throws {
    let person = Person(firstName: "Antoine", lastName: "van der Lee")
    let unwrappedPerson = try #require(person, "Person should be constructed successfully")
    #expect(unwrappedPerson.fullName == "Antoine van der Lee")
}
```
# `@Skip`
Use when I need to skip a function because it will fail or something. 
```swift
@Skip("Waiting for API fix")
@Test
func testBrokenAPI() {
    #expect(someCall() == "Expected")
}

```

# `#fail`
Use to fail a test manually

```swift
if someBadCondition {
    #fail("We hit a bad condition!")
}

```
## Keeping the Test Structure
I can keep a good structure in my tests my creating inner `struct`'s that wil act as modules inside my test. In this case.

```swift
import Testing
@testable import SwiftTestingPlayground

struct PersonTests {
    
    @Test func initialization() {
        let person = Person(firstName: "Antoine", lastName: "van der Lee")
        #expect(person.firstName == "Antoine")
        #expect(person.lastName == "van der Lee")
    }
    
    struct Names {
        @Test func fullName() {
            let person = Person(firstName: "Antoine", lastName: "van der Lee")
            #expect(person.fullName == "Antoine van der Lee")
        }
    }
}
```

## Parameterized Testing
### How to 
1. pass an a collection to the `arguments` argument in the test.
2. create an argument in the `func` testing the behavior, in this case the `mentionedContinents`. Each of the elements in the arguments will be passed to the function in a parallel call. 

```swift
@Test("Continents mentioned in videos", arguments: [
    "A Beach",
    "By the Lake",
    "Camping in the Woods"
])
func mentionedContinents(videoName: String) async throws {
    let videoLibrary = try await VideoLibrary()
    let video = try #require(await videoLibrary.video(named: videoName))
    #expect(video.mentionedContinents.count <= 3)
}
```

### Multiple collections as `arguments`
![[Pasted image 20250415203028.png]]

```swift
@Test(arguments: [1,3,4],["one", "three", "four"])
func add(firstCollection: [Int], secondCollection: [String]) {
	...
}
```

