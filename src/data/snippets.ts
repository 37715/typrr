export const codeSnippets = [
  `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
print(fibonacci(10))`,

  `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[0];
    const left = arr.slice(1).filter(x => x < pivot);
    const right = arr.slice(1).filter(x => x >= pivot);
    return [...quickSort(left), pivot, ...quickSort(right)];
}`,

  `class BinaryTree:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None`,

  `const fetchUserData = async (userId) => {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
    }
};`,

  `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,

  `const useLocalStorage = (key, initialValue) => {
    const [value, setValue] = useState(() => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });
    return [value, setValue];
};`,

  `import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 2*np.pi, 100)
y = np.sin(x)
plt.plot(x, y)`,

  `const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};`
];