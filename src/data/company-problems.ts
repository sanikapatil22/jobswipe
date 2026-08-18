// Company-wise LeetCode problems, sourced from:
// https://github.com/liquidslr/leetcode-company-wise-problems
// Each company's top problems are ranked by reported interview frequency.
// Companies without public data (e.g. Anthropic, Figma) are absent on purpose —
// the UI falls back gracefully.

export interface CompanyProblem {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  frequency: number;
  link: string;
  topics: string[];
}

export const COMPANY_PROBLEMS: Record<string, CompanyProblem[]> = {
  Airbnb: [
    { title: 'Text Justification', difficulty: 'HARD', frequency: 100, link: 'https://leetcode.com/problems/text-justification', topics: ['Array', 'String', 'Simulation'] },
    { title: 'Maximum Profit in Job Scheduling', difficulty: 'HARD', frequency: 92.4, link: 'https://leetcode.com/problems/maximum-profit-in-job-scheduling', topics: ['Array', 'Binary Search', 'DP'] },
    { title: 'Flatten 2D Vector', difficulty: 'MEDIUM', frequency: 85.9, link: 'https://leetcode.com/problems/flatten-2d-vector', topics: ['Array', 'Design', 'Iterator'] },
    { title: 'Smallest Common Region', difficulty: 'MEDIUM', frequency: 84.9, link: 'https://leetcode.com/problems/smallest-common-region', topics: ['Hash Table', 'String', 'Tree'] },
    { title: 'Palindrome Pairs', difficulty: 'HARD', frequency: 84.9, link: 'https://leetcode.com/problems/palindrome-pairs', topics: ['Array', 'Hash Table', 'Trie'] },
    { title: 'Maximum Candies You Can Get from Boxes', difficulty: 'HARD', frequency: 83.9, link: 'https://leetcode.com/problems/maximum-candies-you-can-get-from-boxes', topics: ['Array', 'BFS'] },
    { title: 'Pour Water', difficulty: 'MEDIUM', frequency: 79.2, link: 'https://leetcode.com/problems/pour-water', topics: ['Array', 'Simulation'] },
    { title: 'Sliding Puzzle', difficulty: 'HARD', frequency: 77.8, link: 'https://leetcode.com/problems/sliding-puzzle', topics: ['Array', 'BFS'] },
    { title: 'Trapping Rain Water', difficulty: 'HARD', frequency: 76.4, link: 'https://leetcode.com/problems/trapping-rain-water', topics: ['Array', 'Two Pointers', 'Stack'] },
    { title: 'Intersection of Two Linked Lists', difficulty: 'EASY', frequency: 76.4, link: 'https://leetcode.com/problems/intersection-of-two-linked-lists', topics: ['Hash Table', 'Linked List'] },
    { title: 'Design Excel Sum Formula', difficulty: 'HARD', frequency: 76.4, link: 'https://leetcode.com/problems/design-excel-sum-formula', topics: ['Hash Table', 'String', 'Graph'] },
    { title: 'Alien Dictionary', difficulty: 'HARD', frequency: 74.8, link: 'https://leetcode.com/problems/alien-dictionary', topics: ['String', 'DFS', 'BFS'] },
  ],
  Asana: [
    { title: 'K Closest Points to Origin', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/k-closest-points-to-origin', topics: ['Array', 'Math', 'Geometry'] },
    { title: 'Product of Array Except Self', difficulty: 'MEDIUM', frequency: 97.1, link: 'https://leetcode.com/problems/product-of-array-except-self', topics: ['Array', 'Prefix Sum'] },
    { title: 'Maximum Repeating Substring', difficulty: 'EASY', frequency: 91.9, link: 'https://leetcode.com/problems/maximum-repeating-substring', topics: ['String', 'DP'] },
    { title: 'Minimum Cost Path with Edge Reversals', difficulty: 'MEDIUM', frequency: 87.4, link: 'https://leetcode.com/problems/minimum-cost-path-with-edge-reversals', topics: ['Graph', 'Shortest Path'] },
  ],
  Cloudflare: [
    { title: 'Design Circular Queue', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/design-circular-queue', topics: ['Array', 'Linked List', 'Design'] },
    { title: '3Sum', difficulty: 'MEDIUM', frequency: 94.4, link: 'https://leetcode.com/problems/3sum', topics: ['Array', 'Two Pointers', 'Sorting'] },
    { title: '4Sum', difficulty: 'MEDIUM', frequency: 94.4, link: 'https://leetcode.com/problems/4sum', topics: ['Array', 'Two Pointers', 'Sorting'] },
    { title: 'Design a Stack With Increment Operation', difficulty: 'MEDIUM', frequency: 84.3, link: 'https://leetcode.com/problems/design-a-stack-with-increment-operation', topics: ['Array', 'Stack', 'Design'] },
    { title: 'Reaching Points', difficulty: 'HARD', frequency: 84.3, link: 'https://leetcode.com/problems/reaching-points', topics: ['Math'] },
    { title: 'Design Hit Counter', difficulty: 'MEDIUM', frequency: 74.5, link: 'https://leetcode.com/problems/design-hit-counter', topics: ['Design', 'Queue', 'Data Stream'] },
    { title: 'Number of Islands', difficulty: 'MEDIUM', frequency: 69.9, link: 'https://leetcode.com/problems/number-of-islands', topics: ['Array', 'DFS', 'BFS', 'Union Find'] },
    { title: 'LRU Cache', difficulty: 'MEDIUM', frequency: 63.9, link: 'https://leetcode.com/problems/lru-cache', topics: ['Hash Table', 'Linked List', 'Design'] },
    { title: 'Game of Life', difficulty: 'MEDIUM', frequency: 55.5, link: 'https://leetcode.com/problems/game-of-life', topics: ['Array', 'Matrix', 'Simulation'] },
    { title: 'Fizz Buzz', difficulty: 'EASY', frequency: 55.5, link: 'https://leetcode.com/problems/fizz-buzz', topics: ['Math', 'String'] },
  ],
  Coinbase: [
    { title: 'Simple Bank System', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/simple-bank-system', topics: ['Array', 'Hash Table', 'Design'] },
    { title: 'Zigzag Iterator', difficulty: 'MEDIUM', frequency: 96.4, link: 'https://leetcode.com/problems/zigzag-iterator', topics: ['Array', 'Design', 'Iterator'] },
    { title: 'Time Based Key-Value Store', difficulty: 'MEDIUM', frequency: 90.4, link: 'https://leetcode.com/problems/time-based-key-value-store', topics: ['Hash Table', 'Binary Search', 'Design'] },
    { title: 'Decode the Message', difficulty: 'EASY', frequency: 88.6, link: 'https://leetcode.com/problems/decode-the-message', topics: ['Hash Table', 'String'] },
    { title: 'Design In-Memory File System', difficulty: 'HARD', frequency: 84.4, link: 'https://leetcode.com/problems/design-in-memory-file-system', topics: ['Hash Table', 'Design', 'Trie'] },
    { title: 'Design File System', difficulty: 'MEDIUM', frequency: 67.5, link: 'https://leetcode.com/problems/design-file-system', topics: ['Hash Table', 'Design', 'Trie'] },
    { title: 'Text Justification', difficulty: 'HARD', frequency: 61.5, link: 'https://leetcode.com/problems/text-justification', topics: ['Array', 'String', 'Simulation'] },
    { title: 'Check if There is a Valid Partition For The Array', difficulty: 'MEDIUM', frequency: 61.5, link: 'https://leetcode.com/problems/check-if-there-is-a-valid-partition-for-the-array', topics: ['Array', 'DP'] },
    { title: 'Random Pick with Weight', difficulty: 'MEDIUM', frequency: 61.5, link: 'https://leetcode.com/problems/random-pick-with-weight', topics: ['Array', 'Math', 'Binary Search'] },
    { title: 'Number of Orders in the Backlog', difficulty: 'MEDIUM', frequency: 53.1, link: 'https://leetcode.com/problems/number-of-orders-in-the-backlog', topics: ['Array', 'Heap', 'Simulation'] },
    { title: 'Evaluate Division', difficulty: 'MEDIUM', frequency: 53.1, link: 'https://leetcode.com/problems/evaluate-division', topics: ['String', 'DFS', 'BFS', 'Graph'] },
    { title: 'Find the Length of the Longest Common Prefix', difficulty: 'MEDIUM', frequency: 53.1, link: 'https://leetcode.com/problems/find-the-length-of-the-longest-common-prefix', topics: ['Hash Table', 'String', 'Trie'] },
  ],
  Databricks: [
    { title: 'Design Hit Counter', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/design-hit-counter', topics: ['Design', 'Queue', 'Data Stream'] },
    { title: 'IP to CIDR', difficulty: 'MEDIUM', frequency: 97.2, link: 'https://leetcode.com/problems/ip-to-cidr', topics: ['String', 'Bit Manipulation'] },
    { title: 'Design Tic-Tac-Toe', difficulty: 'MEDIUM', frequency: 93.6, link: 'https://leetcode.com/problems/design-tic-tac-toe', topics: ['Array', 'Hash Table', 'Design'] },
    { title: 'House Robber', difficulty: 'MEDIUM', frequency: 85, link: 'https://leetcode.com/problems/house-robber', topics: ['Array', 'DP'] },
    { title: 'Step-By-Step Directions From a Binary Tree Node to Another', difficulty: 'MEDIUM', frequency: 83.6, link: 'https://leetcode.com/problems/step-by-step-directions-from-a-binary-tree-node-to-another', topics: ['String', 'Tree', 'DFS'] },
    { title: 'Find All Anagrams in a String', difficulty: 'MEDIUM', frequency: 83.6, link: 'https://leetcode.com/problems/find-all-anagrams-in-a-string', topics: ['Hash Table', 'String', 'Sliding Window'] },
    { title: 'Time Based Key-Value Store', difficulty: 'MEDIUM', frequency: 82.2, link: 'https://leetcode.com/problems/time-based-key-value-store', topics: ['Hash Table', 'Binary Search', 'Design'] },
    { title: 'House Robber II', difficulty: 'MEDIUM', frequency: 79.8, link: 'https://leetcode.com/problems/house-robber-ii', topics: ['Array', 'DP'] },
    { title: 'Longest Palindrome by Concatenating Two Letter Words', difficulty: 'MEDIUM', frequency: 65.2, link: 'https://leetcode.com/problems/longest-palindrome-by-concatenating-two-letter-words', topics: ['Hash Table', 'String', 'Greedy'] },
    { title: 'Closest Leaf in a Binary Tree', difficulty: 'MEDIUM', frequency: 65.2, link: 'https://leetcode.com/problems/closest-leaf-in-a-binary-tree', topics: ['Tree', 'DFS', 'BFS'] },
    { title: 'RLE Iterator', difficulty: 'MEDIUM', frequency: 65.2, link: 'https://leetcode.com/problems/rle-iterator', topics: ['Array', 'Design', 'Iterator'] },
    { title: 'Number of Recent Calls', difficulty: 'EASY', frequency: 63.2, link: 'https://leetcode.com/problems/number-of-recent-calls', topics: ['Design', 'Queue', 'Data Stream'] },
  ],
  Duolingo: [
    { title: 'Encrypt and Decrypt Strings', difficulty: 'HARD', frequency: 100, link: 'https://leetcode.com/problems/encrypt-and-decrypt-strings', topics: ['Hash Table', 'String', 'Design'] },
    { title: 'Minimum Number of People to Teach', difficulty: 'MEDIUM', frequency: 84.7, link: 'https://leetcode.com/problems/minimum-number-of-people-to-teach', topics: ['Array', 'Hash Table', 'Greedy'] },
    { title: 'K Radius Subarray Averages', difficulty: 'MEDIUM', frequency: 82.9, link: 'https://leetcode.com/problems/k-radius-subarray-averages', topics: ['Array', 'Sliding Window'] },
    { title: 'Longest Increasing Path in a Matrix', difficulty: 'HARD', frequency: 70, link: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix', topics: ['Array', 'DP', 'DFS', 'BFS'] },
    { title: 'Task Scheduler II', difficulty: 'MEDIUM', frequency: 65.9, link: 'https://leetcode.com/problems/task-scheduler-ii', topics: ['Array', 'Hash Table', 'Simulation'] },
  ],
  MongoDB: [
    { title: 'Word Break', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/word-break', topics: ['Hash Table', 'String', 'DP', 'Trie'] },
    { title: 'Implement Trie (Prefix Tree)', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/implement-trie-prefix-tree', topics: ['Hash Table', 'String', 'Design', 'Trie'] },
    { title: 'Intersection of Two Arrays', difficulty: 'EASY', frequency: 97.1, link: 'https://leetcode.com/problems/intersection-of-two-arrays', topics: ['Array', 'Hash Table', 'Two Pointers'] },
    { title: 'Snapshot Array', difficulty: 'MEDIUM', frequency: 97.1, link: 'https://leetcode.com/problems/snapshot-array', topics: ['Array', 'Hash Table', 'Binary Search', 'Design'] },
    { title: 'Merge k Sorted Lists', difficulty: 'HARD', frequency: 85.4, link: 'https://leetcode.com/problems/merge-k-sorted-lists', topics: ['Linked List', 'Divide and Conquer', 'Heap'] },
    { title: 'Text Justification', difficulty: 'HARD', frequency: 85.4, link: 'https://leetcode.com/problems/text-justification', topics: ['Array', 'String', 'Simulation'] },
    { title: 'LRU Cache', difficulty: 'MEDIUM', frequency: 79.8, link: 'https://leetcode.com/problems/lru-cache', topics: ['Hash Table', 'Linked List', 'Design'] },
    { title: 'Insert Interval', difficulty: 'MEDIUM', frequency: 72.6, link: 'https://leetcode.com/problems/insert-interval', topics: ['Array'] },
    { title: 'Web Crawler Multithreaded', difficulty: 'MEDIUM', frequency: 72.6, link: 'https://leetcode.com/problems/web-crawler-multithreaded', topics: ['DFS', 'BFS', 'Concurrency'] },
    { title: 'Stock Price Fluctuation', difficulty: 'MEDIUM', frequency: 72.6, link: 'https://leetcode.com/problems/stock-price-fluctuation', topics: ['Hash Table', 'Design', 'Heap'] },
    { title: 'Course Schedule II', difficulty: 'MEDIUM', frequency: 72.6, link: 'https://leetcode.com/problems/course-schedule-ii', topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'] },
    { title: 'Search in Rotated Sorted Array', difficulty: 'MEDIUM', frequency: 62.6, link: 'https://leetcode.com/problems/search-in-rotated-sorted-array', topics: ['Array', 'Binary Search'] },
  ],
  Roblox: [
    { title: 'Candy Crush', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/candy-crush', topics: ['Array', 'Matrix', 'Simulation'] },
    { title: 'Reorganize String', difficulty: 'MEDIUM', frequency: 94.7, link: 'https://leetcode.com/problems/reorganize-string', topics: ['Hash Table', 'String', 'Greedy'] },
    { title: 'Number of Ways to Wear Different Hats to Each Other', difficulty: 'HARD', frequency: 92.6, link: 'https://leetcode.com/problems/number-of-ways-to-wear-different-hats-to-each-other', topics: ['Array', 'DP', 'Bitmask'] },
    { title: 'Text Justification', difficulty: 'HARD', frequency: 89.4, link: 'https://leetcode.com/problems/text-justification', topics: ['Array', 'String', 'Simulation'] },
    { title: 'Task Scheduler', difficulty: 'MEDIUM', frequency: 85.6, link: 'https://leetcode.com/problems/task-scheduler', topics: ['Array', 'Hash Table', 'Greedy'] },
    { title: 'Maximize Distance to Closest Person', difficulty: 'MEDIUM', frequency: 85.6, link: 'https://leetcode.com/problems/maximize-distance-to-closest-person', topics: ['Array'] },
    { title: 'Course Schedule II', difficulty: 'MEDIUM', frequency: 83.4, link: 'https://leetcode.com/problems/course-schedule-ii', topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'] },
    { title: 'Design Hit Counter', difficulty: 'MEDIUM', frequency: 76.7, link: 'https://leetcode.com/problems/design-hit-counter', topics: ['Design', 'Queue', 'Data Stream'] },
    { title: 'Count Number of Nice Subarrays', difficulty: 'MEDIUM', frequency: 73.2, link: 'https://leetcode.com/problems/count-number-of-nice-subarrays', topics: ['Array', 'Hash Table', 'Sliding Window'] },
    { title: 'Group the People Given the Group Size They Belong To', difficulty: 'MEDIUM', frequency: 73.2, link: 'https://leetcode.com/problems/group-the-people-given-the-group-size-they-belong-to', topics: ['Array', 'Hash Table', 'Greedy'] },
    { title: 'Integer to English Words', difficulty: 'HARD', frequency: 73.2, link: 'https://leetcode.com/problems/integer-to-english-words', topics: ['Math', 'String', 'Recursion'] },
    { title: 'Design Search Autocomplete System', difficulty: 'HARD', frequency: 73.2, link: 'https://leetcode.com/problems/design-search-autocomplete-system', topics: ['String', 'Design', 'Trie'] },
  ],
  Stripe: [
    { title: 'Minimum Penalty for a Shop', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/minimum-penalty-for-a-shop', topics: ['String', 'Prefix Sum'] },
    { title: 'Calculate Amount Paid in Taxes', difficulty: 'EASY', frequency: 89.3, link: 'https://leetcode.com/problems/calculate-amount-paid-in-taxes', topics: ['Array', 'Simulation'] },
    { title: 'Evaluate Division', difficulty: 'MEDIUM', frequency: 86.4, link: 'https://leetcode.com/problems/evaluate-division', topics: ['String', 'DFS', 'BFS', 'Graph'] },
    { title: 'Invalid Transactions', difficulty: 'MEDIUM', frequency: 86.4, link: 'https://leetcode.com/problems/invalid-transactions', topics: ['Array', 'Hash Table', 'String'] },
    { title: 'Brace Expansion', difficulty: 'MEDIUM', frequency: 83, link: 'https://leetcode.com/problems/brace-expansion', topics: ['String', 'Backtracking', 'Stack'] },
    { title: 'Cheapest Flights Within K Stops', difficulty: 'MEDIUM', frequency: 79, link: 'https://leetcode.com/problems/cheapest-flights-within-k-stops', topics: ['DP', 'DFS', 'BFS', 'Graph', 'Heap'] },
    { title: 'Parallel Courses III', difficulty: 'HARD', frequency: 58.8, link: 'https://leetcode.com/problems/parallel-courses-iii', topics: ['Array', 'DP', 'Graph', 'Topological Sort'] },
    { title: 'One Edit Distance', difficulty: 'MEDIUM', frequency: 58.8, link: 'https://leetcode.com/problems/one-edit-distance', topics: ['Two Pointers', 'String'] },
    { title: 'Number of Black Blocks', difficulty: 'MEDIUM', frequency: 58.8, link: 'https://leetcode.com/problems/number-of-black-blocks', topics: ['Array', 'Hash Table'] },
    { title: 'Alert Using Same Key-Card Three or More Times in a One Hour Period', difficulty: 'MEDIUM', frequency: 58.8, link: 'https://leetcode.com/problems/alert-using-same-key-card-three-or-more-times-in-a-one-hour-period', topics: ['Array', 'Hash Table', 'String'] },
    { title: 'Simple Bank System', difficulty: 'MEDIUM', frequency: 58.8, link: 'https://leetcode.com/problems/simple-bank-system', topics: ['Array', 'Hash Table', 'Design'] },
  ],
  Twilio: [
    { title: 'Maximize Greatness of an Array', difficulty: 'MEDIUM', frequency: 100, link: 'https://leetcode.com/problems/maximize-greatness-of-an-array', topics: ['Array', 'Two Pointers', 'Greedy'] },
    { title: 'Reformat Date', difficulty: 'EASY', frequency: 96, link: 'https://leetcode.com/problems/reformat-date', topics: ['String'] },
    { title: 'Univalued Binary Tree', difficulty: 'EASY', frequency: 96, link: 'https://leetcode.com/problems/univalued-binary-tree', topics: ['Tree', 'DFS', 'BFS'] },
    { title: 'Count Vowel Strings in Ranges', difficulty: 'MEDIUM', frequency: 75.9, link: 'https://leetcode.com/problems/count-vowel-strings-in-ranges', topics: ['Array', 'String', 'Prefix Sum'] },
    { title: 'Top K Frequent Elements', difficulty: 'MEDIUM', frequency: 69.7, link: 'https://leetcode.com/problems/top-k-frequent-elements', topics: ['Array', 'Hash Table', 'Heap'] },
    { title: 'Group Anagrams', difficulty: 'MEDIUM', frequency: 69.7, link: 'https://leetcode.com/problems/group-anagrams', topics: ['Array', 'Hash Table', 'String'] },
    { title: 'Ways to Make a Fair Array', difficulty: 'MEDIUM', frequency: 60.8, link: 'https://leetcode.com/problems/ways-to-make-a-fair-array', topics: ['Array', 'Prefix Sum'] },
    { title: 'Furthest Building You Can Reach', difficulty: 'MEDIUM', frequency: 60.8, link: 'https://leetcode.com/problems/furthest-building-you-can-reach', topics: ['Array', 'Greedy', 'Heap'] },
    { title: 'Search Suggestions System', difficulty: 'MEDIUM', frequency: 60.8, link: 'https://leetcode.com/problems/search-suggestions-system', topics: ['Array', 'String', 'Binary Search', 'Trie'] },
  ],
};

// Fallback curated problems for companies with no public data (e.g. Anthropic, Figma).
export const FALLBACK_COMPANY_PROBLEMS: CompanyProblem[] = [
  { title: 'Two Sum', difficulty: 'EASY', frequency: 100, link: 'https://leetcode.com/problems/two-sum', topics: ['Array', 'Hash Table'] },
  { title: 'LRU Cache', difficulty: 'MEDIUM', frequency: 98, link: 'https://leetcode.com/problems/lru-cache', topics: ['Hash Table', 'Linked List', 'Design'] },
  { title: 'Number of Islands', difficulty: 'MEDIUM', frequency: 97, link: 'https://leetcode.com/problems/number-of-islands', topics: ['Array', 'DFS', 'BFS', 'Union Find'] },
  { title: 'Longest Substring Without Repeating Characters', difficulty: 'MEDIUM', frequency: 96, link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', topics: ['Hash Table', 'String', 'Sliding Window'] },
  { title: 'Merge Intervals', difficulty: 'MEDIUM', frequency: 95, link: 'https://leetcode.com/problems/merge-intervals', topics: ['Array', 'Sorting'] },
  { title: 'K Closest Points to Origin', difficulty: 'MEDIUM', frequency: 94, link: 'https://leetcode.com/problems/k-closest-points-to-origin', topics: ['Array', 'Math', 'Heap'] },
  { title: 'Product of Array Except Self', difficulty: 'MEDIUM', frequency: 93, link: 'https://leetcode.com/problems/product-of-array-except-self', topics: ['Array', 'Prefix Sum'] },
  { title: 'Sliding Window Maximum', difficulty: 'HARD', frequency: 92, link: 'https://leetcode.com/problems/sliding-window-maximum', topics: ['Array', 'Queue', 'Heap'] },
  { title: 'Design Hit Counter', difficulty: 'MEDIUM', frequency: 91, link: 'https://leetcode.com/problems/design-hit-counter', topics: ['Design', 'Queue', 'Data Stream'] },
  { title: 'Course Schedule', difficulty: 'MEDIUM', frequency: 90, link: 'https://leetcode.com/problems/course-schedule', topics: ['DFS', 'BFS', 'Graph', 'Topological Sort'] },
  { title: 'Trapping Rain Water', difficulty: 'HARD', frequency: 89, link: 'https://leetcode.com/problems/trapping-rain-water', topics: ['Array', 'Two Pointers', 'Stack'] },
  { title: 'Top K Frequent Elements', difficulty: 'MEDIUM', frequency: 88, link: 'https://leetcode.com/problems/top-k-frequent-elements', topics: ['Array', 'Hash Table', 'Heap'] },
];

export function getCompanyProblems(companyName: string): CompanyProblem[] {
  return COMPANY_PROBLEMS[companyName] ?? FALLBACK_COMPANY_PROBLEMS;
}
