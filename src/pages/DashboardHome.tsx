import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    BookOpen,
    Users,
    ArrowLeftRight,
    BookMarked,
    Plus,
    Edit,
    Trash2
} from 'lucide-react'
import api from '@/utils/axios'

interface Category {
    id: number
    category_name: string
    category_description: string
    who_edited?: string
    created_at: string
    updated_at: string
}

export default function DashboardHome() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const [formData, setFormData] = useState({
        category_name: '',
        category_description: '',
        who_edited: ''
    })

    const stats = [
        { title: 'Total Books', value: '0', icon: BookOpen, color: 'bg-blue-500' },
        { title: 'Available Books', value: '0', icon: BookMarked, color: 'bg-green-500' },
        { title: 'Active Borrowers', value: '0', icon: Users, color: 'bg-purple-500' },
        { title: 'Transactions', value: '0', icon: ArrowLeftRight, color: 'bg-orange-500' }
    ]

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories')
            if (response.data.success) {
                setCategories(response.data.data)
            }
        } catch (error: any) {
            console.error('Error fetching categories:', error)
            setError('Failed to fetch categories')
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const resetForm = () => {
        setFormData({ category_name: '', category_description: '', who_edited: '' })
        setEditingCategory(null)
        setShowForm(false)
        setError('')
    }

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const response = await api.post('/create/categories', {
                ...formData,
                who_edited: formData.who_edited || 'Admin'
            })

            if (response.data.success) {
                resetForm()
                fetchCategories()
            } else {
                setError(response.data.message || 'Failed to create category')
            }
        } catch (error: any) {
            console.error('Error creating category:', error)
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const firstError = Object.values(errors)[0] as string[]
                setError(firstError[0] || 'Validation failed')
            } else {
                setError(error.response?.data?.message || 'Failed to create category')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCategory) return

        setIsLoading(true)
        setError('')

        try {
            const response = await api.post(`/update/categories/${editingCategory.id}`, {
                ...formData,
                who_edited: formData.who_edited || 'Admin'
            })

            if (response.data.success) {
                resetForm()
                fetchCategories()
            } else {
                setError(response.data.message || 'Failed to update category')
            }
        } catch (error: any) {
            console.error('Error updating category:', error)
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const firstError = Object.values(errors)[0] as string[]
                setError(firstError[0] || 'Validation failed')
            } else {
                setError(error.response?.data?.message || 'Failed to update category')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return
        try {
            const response = await api.delete(`/categories/${id}`)
            if (response.data.success) fetchCategories()
        } catch (error: any) {
            console.error('Error deleting category:', error)
            setError('Failed to delete category')
        }
    }

    const startEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            category_name: category.category_name,
            category_description: category.category_description,
            who_edited: category.who_edited || ''
        })
        setShowForm(true)
    }

    return (
        <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome to your library management system</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm text-gray-600">{stat.title}</CardTitle>
                                <div className={`${stat.color} p-2 rounded-lg`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Categories */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Categories Book</CardTitle>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Category Form */}
                    {showForm && (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingCategory ? 'Edit Category' : 'Create New Category'}
                            </h3>
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                    {error}
                                </div>
                            )}
                            <form
                                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category_name">Category Name *</Label>
                                        <Input
                                            id="category_name"
                                            name="category_name"
                                            value={formData.category_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter category name"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="who_edited">Edited By</Label>
                                        <Input
                                            id="who_edited"
                                            name="who_edited"
                                            value={formData.who_edited}
                                            onChange={handleInputChange}
                                            placeholder="Enter editor name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category_description">Description</Label>
                                    <textarea
                                        id="category_description"
                                        name="category_description"
                                        value={formData.category_description}
                                        onChange={handleInputChange}
                                        placeholder="Enter category description"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Categories List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                            Existing Categories ({categories.length})
                        </h3>
                        {categories.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No categories found</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg"
                                    >
                                        <div>
                                            <h4 className="font-semibold">{category.category_name}</h4>
                                            {category.category_description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {category.category_description}
                                                </p>
                                            )}
                                            <div className="text-xs text-gray-500 mt-2">
                                                Created: {new Date(category.created_at).toLocaleDateString()}
                                                {category.who_edited && ` • Edited by: ${category.who_edited}`}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3 sm:mt-0">
                                            <Button variant="outline" size="sm" onClick={() => startEdit(category)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500 text-center py-8">No recent activity</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Books Added Today</span>
                                <span className="text-gray-900">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Books Borrowed Today</span>
                                <span className="text-gray-900">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Books Returned Today</span>
                                <span className="text-gray-900">0</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
