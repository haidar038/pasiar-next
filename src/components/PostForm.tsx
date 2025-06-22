// components/PostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/contexts/PostsContext";
import { CreatePostData, UpdatePostData, Post, Category, Tag } from "@/types/post";

interface PostFormProps {
    post?: Post; // For editing
    onSuccess?: (post: Post) => void;
    onCancel?: () => void;
}

export default function PostForm({ post, onSuccess, onCancel }: PostFormProps) {
    const { user } = useAuth();
    const { createPost, updatePost, categories, tags, fetchCategories, fetchTags, isLoading, error } = usePosts();

    const isContributor = user?.roles?.includes("contributor") ?? false;

    const [formData, setFormData] = useState<CreatePostData>({
        title: "",
        content: "",
        excerpt: "",
        status: "draft",
        featuredImage: "",
        categories: [],
        tags: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [showTagInput, setShowTagInput] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [previewMode, setPreviewMode] = useState(false);

    // Load categories and tags on mount
    useEffect(() => {
        fetchCategories();
        fetchTags();
    }, []);

    // Helper function to strip HTML tags using regex
    const stripHtmlTags = (html: string): string => {
        return html.replace(/<[^>]*>/g, "");
    };

    // Helper function to handle HTML content
    const parseHtmlContent = (html: string): string => {
        // If the content appears to be HTML (contains tags), strip them for editing
        if (html && (html.includes("</") || html.includes("/>"))) {
            return stripHtmlTags(html);
        }
        return html;
    };

    // Populate form when editing
    useEffect(() => {
        if (post) {
            setFormData({
                title: parseHtmlContent(post.title),
                content: parseHtmlContent(post.content),
                excerpt: post.excerpt ? parseHtmlContent(post.excerpt) : "",
                status: post.status,
                featuredImage: post.featuredImage || "",
                categories: post.categories?.map((cat) => cat.id) || [],
                tags: post.tags?.map((tag) => tag.name) || [],
            });
        }
    }, [post]);

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.title.trim()) {
            errors.title = "Title is required";
        }

        if (!formData.content.trim()) {
            errors.content = "Content is required";
        }

        if (formData.title.length > 200) {
            errors.title = "Title must be less than 200 characters";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let result: Post;

            if (post) {
                // Update existing post
                // Ensure categories is an array of numbers
                const categories = formData.categories ? formData.categories.map((id) => (typeof id === "string" ? parseInt(id, 10) : id)) : [];

                const updateData: UpdatePostData = {
                    ...formData,
                    id: post.id,
                    categories, // Ensure this is properly set
                };

                console.log("Submitting update with data:", updateData);
                console.log("Categories being sent:", updateData.categories);
                result = await updatePost(updateData);
            } else {
                // Create new post
                console.log("Creating new post with data:", formData);
                result = await createPost(formData);
            }

            onSuccess?.(result);
        } catch (err) {
            console.error("Post form error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleCategoryChange = (categoryId: number, checked: boolean) => {
        console.log(`Category ${categoryId} ${checked ? "checked" : "unchecked"}`);
        setFormData((prev) => {
            const updatedCategories = checked ? [...(prev.categories || []), categoryId] : (prev.categories || []).filter((id) => id !== categoryId);

            console.log("Updated categories:", updatedCategories);

            return {
                ...prev,
                categories: updatedCategories,
            };
        });
    };

    const handleTagAdd = (tagName: string) => {
        if (tagName.trim() && !formData.tags?.includes(tagName)) {
            setFormData((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tagName.trim()],
            }));
        }
    };

    const handleTagRemove = (tagName: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: (prev.tags || []).filter((tag) => tag !== tagName),
        }));
    };

    const handleAddNewTag = () => {
        if (newTag.trim()) {
            handleTagAdd(newTag);
            setNewTag("");
            setShowTagInput(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddNewTag();
        }
    };

    const generateExcerpt = () => {
        if (formData.content) {
            const plainText = formData.content.replace(/<[^>]*>/g, "");
            const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");
            setFormData((prev) => ({ ...prev, excerpt }));
        }
    };

    if (isLoading && !post) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{post ? "Edit Post" : "Create New Post"}</h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {previewMode ? "Edit" : "Preview"}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {previewMode ? (
                // Preview Mode
                <div className="prose max-w-none">
                    <h1 className="text-3xl font-bold mb-4">{formData.title || "Untitled Post"}</h1>
                    {formData.excerpt && <p className="text-lg text-gray-600 italic mb-6">{formData.excerpt}</p>}
                    {formData.featuredImage && <img src={formData.featuredImage} alt="Featured" className="w-full h-64 object-cover rounded-lg mb-6" />}
                    <div className="prose-content" dangerouslySetInnerHTML={{ __html: formData.content }} />
                    <div className="flex flex-wrap gap-2 mt-6">
                        {formData.categories?.map((catId) => {
                            const category = categories.find((c) => c.id === catId);
                            return category ? (
                                <span key={catId} className="px-3 py-1 text-sm font-medium text-white rounded-full" style={{ backgroundColor: category.color }}>
                                    {category.name}
                                </span>
                            ) : null;
                        })}
                        {formData.tags?.map((tagName) => (
                            <span key={tagName} className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                                #{tagName}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                // Edit Mode
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? "border-red-300" : "border-gray-300"}`}
                            placeholder="Enter your post title..."
                        />
                        {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                    </div>

                    {/* Content */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            rows={12}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.content ? "border-red-300" : "border-gray-300"}`}
                            placeholder="Write your post content here..."
                        />
                        {formErrors.content && <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>}
                    </div>

                    {/* Excerpt */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                                Excerpt
                            </label>
                            <button type="button" onClick={generateExcerpt} className="text-sm text-blue-600 hover:text-blue-800">
                                Generate from content
                            </button>
                        </div>
                        <textarea
                            id="excerpt"
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief description of your post..."
                        />
                        <p className="mt-1 text-sm text-gray-500">{formData.excerpt?.length || 0}/200 characters</p>
                    </div>

                    {/* Featured Image */}
                    <div>
                        <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
                            Featured Image URL
                        </label>
                        <input
                            type="url"
                            id="featuredImage"
                            name="featuredImage"
                            value={formData.featuredImage}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.featuredImage && (
                            <div className="mt-3">
                                <img
                                    src={formData.featuredImage}
                                    alt="Featured preview"
                                    className="w-full h-48 object-cover rounded-md"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categories */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                                {categories.map((category) => (
                                    <label key={category.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.categories?.includes(category.id) || false}
                                            onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">{category.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>

                            {/* Selected Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags?.map((tag) => (
                                    <span key={tag} className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                                        #{tag}
                                        <button type="button" onClick={() => handleTagRemove(tag)} className="ml-2 text-green-600 hover:text-green-800">
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Existing Tags */}
                            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 mb-3">
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleTagAdd(tag.name)}
                                        disabled={formData.tags?.includes(tag.name)}
                                        className={`text-sm px-2 py-1 rounded ${
                                            formData.tags?.includes(tag.name) ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50 cursor-pointer"
                                        }`}
                                    >
                                        #{tag.name}
                                    </button>
                                ))}
                            </div>

                            {/* Add New Tag */}
                            {showTagInput ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter new tag..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={handleAddNewTag} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTagInput(false);
                                            setNewTag("");
                                        }}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setShowTagInput(true)} className="text-sm text-blue-600 hover:text-blue-800">
                                    + Add new tag
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="draft">Draft</option>
                            {!isContributor && <option value="published">Published</option>}
                            {!isContributor && <option value="private">Private</option>}
                        </select>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="px-6 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    {post ? "Updating..." : "Creating..."}
                                </span>
                            ) : post ? (
                                "Update Post"
                            ) : (
                                "Create Post"
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
