import asyncio
import hindsight_service

batches = [
    [
        "User attempted a Recursion problem: Fibonacci Sequence",
        "Behavioral pattern observed: forgot base case for n=0, caused infinite recursion",
        "Mistake category: conceptual",
        "Language used: Python",
        "Code Autopsy summary: User understands recursion structure but consistently misses terminal conditions"
    ],
    [
        "User attempted a Recursion problem: Tower of Hanoi",
        "Behavioral pattern observed: base case present but off-by-one in recursive call",
        "Mistake category: logic",
        "Language used: Python",
        "Code Autopsy summary: recursion depth tracked incorrectly, n-1 used where n was needed"
    ],
    [
        "User attempted an Arrays problem: Rotate Array",
        "Behavioral pattern observed: loop ran to len(arr) instead of len(arr)-1, index out of bounds",
        "Mistake category: logic",
        "Language used: Python",
        "Code Autopsy summary: classic off-by-one error, user does not dry-run loop boundaries"
    ],
    [
        "User attempted a Strings problem: Reverse Words in a String",
        "Behavioral pattern observed: empty string input caused crash, not handled",
        "Mistake category: conceptual",
        "Language used: JavaScript",
        "Code Autopsy summary: user skips input validation entirely, assumes clean input always"
    ],
    [
        "User attempted a Dynamic Programming problem: Coin Change",
        "Behavioral pattern observed: used O(n^2) brute force when O(n) DP table was possible",
        "Mistake category: complexity",
        "Language used: Python",
        "Code Autopsy summary: user does not consider optimal substructure, jumps to brute force"
    ],
    [
        "User attempted a Sorting problem: Find Kth Largest Element",
        "Behavioral pattern observed: sorted entire array instead of using a min-heap",
        "Mistake category: complexity",
        "Language used: Python",
        "Code Autopsy summary: user unaware of heap-based selection algorithm, defaults to sort"
    ],
    [
        "User attempted a Sliding Window problem: Longest Substring Without Repeating",
        "Behavioral pattern observed: correctly used two-pointer technique with a set",
        "Mistake category: none",
        "Language used: Python",
        "Code Autopsy summary: clean sliding window implementation, good variable naming, considered edge cases"
    ],
    [
        "User attempted a Binary Search problem: Search in Rotated Array",
        "Behavioral pattern observed: correctly identified pivot and applied binary search on correct half",
        "Mistake category: none",
        "Language used: Python",
        "Code Autopsy summary: user is strong in binary search pattern recognition, clean O(log n) solution"
    ],
    [
        "User attempted a Linked Lists problem: Remove Nth Node from End",
        "Behavioral pattern observed: null pointer when list has only one node, not handled",
        "Mistake category: conceptual",
        "Language used: Python",
        "Code Autopsy summary: edge case of single-node list consistently missed, input validation habit absent"
    ],
    [
        "User attempted a Trees problem: Maximum Depth of Binary Tree",
        "Behavioral pattern observed: forgot to handle null node at leaf level",
        "Mistake category: conceptual",
        "Language used: Python",
        "Code Autopsy summary: third recursion-related base case miss, user does not think about terminal states first"
    ]
]

async def main():
    for i, batch in enumerate(batches):
        print(f"Retaining batch {i+1}...")
        await hindsight_service.retain_facts(batch)
        
    print("Seeding complete. Run the app and check the dashboard.")

if __name__ == "__main__":
    asyncio.run(main())
