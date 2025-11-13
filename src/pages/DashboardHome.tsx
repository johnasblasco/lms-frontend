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
    Trash2,
    TrendingUp,
} from 'lucide-react'
import api from '@/utils/axios'

interface Category {
    category_id: number
    category_name: string
    category_description: string
    who_edited?: string
    created_at: string
    updated_at: string
}

interface DashboardStats {
    total_books: number
    available_books: number
    active_borrowers: number
    total_transactions: number
}

interface QuickStats {
    books_added_today: number
    books_borrowed_today: number
    books_returned_today: number
}

export default function DashboardHome() {
    const [categories, setCategories] = useState<Category[]>([])
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        total_books: 0,
        available_books: 0,
        active_borrowers: 0,
        total_transactions: 0
    })
    const [quickStats, setQuickStats] = useState<QuickStats>({
        books_added_today: 0,
        books_borrowed_today: 0,
        books_returned_today: 0
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const [formData, setFormData] = useState({
        category_name: '',
        category_description: '',
        who_edited: ''
    })

    // Stats cards configuration
    const stats = [
        {
            title: 'Total Books',
            value: dashboardStats.total_books.toString(),
            icon: BookOpen,
            color: 'bg-blue-500',
            description: 'All books in library'
        },
        {
            title: 'Available Books',
            value: dashboardStats.available_books.toString(),
            icon: BookMarked,
            color: 'bg-green-500',
            description: 'Ready to borrow'
        },
        {
            title: 'Active Borrowers',
            value: dashboardStats.active_borrowers.toString(),
            icon: Users,
            color: 'bg-purple-500',
            description: 'Currently borrowing'
        },
        {
            title: 'Total Transactions',
            value: dashboardStats.total_transactions.toString(),
            icon: ArrowLeftRight,
            color: 'bg-orange-500',
            description: 'All-time transactions'
        }
    ]

    // Fetch dashboard summary
    const fetchDashboardSummary = async () => {
        try {
            const response = await api.get('/dashboard/summary')
            if (response.data.success) {
                setDashboardStats(response.data.data)
            }
        } catch (error: any) {
            console.error('Error fetching dashboard summary:', error)
            setError('Failed to fetch dashboard data')
        }
    }

    // Fetch categories
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

    // Fetch quick stats (you might want to create a separate endpoint for this)
    const fetchQuickStats = async () => {
        try {
            // This is a placeholder - you might want to create a separate endpoint for today's stats
            // For now, we'll use mock data
            setQuickStats({
                books_added_today: 2,
                books_borrowed_today: 5,
                books_returned_today: 3
            })
        } catch (error: any) {
            console.error('Error fetching quick stats:', error)
        }
    }

    useEffect(() => {
        fetchDashboardSummary()
        fetchCategories()
        fetchQuickStats()
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
                // Refresh dashboard stats after category creation
                fetchDashboardSummary()
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
            const response = await api.post(`/update/categories/${editingCategory.category_id}`, {
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
            const response = await api.post(`/archive/categories/${id}`)
            if (response.data.success) {
                fetchCategories()
                // Refresh dashboard stats after category deletion
                fetchDashboardSummary()
            }
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

    // Calculate availability percentage
    const availabilityPercentage = dashboardStats.total_books > 0
        ? Math.round((dashboardStats.available_books / dashboardStats.total_books) * 100)
        : 0

    return (
        <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome to your library management system</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm text-gray-600">{stat.title}</CardTitle>
                                <div className={`${stat.color} p-2 rounded-lg`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Availability Overview */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Library Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-4">Book Availability</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Books</span>
                                    <span className="font-semibold">{dashboardStats.total_books}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Available Books</span>
                                    <span className="font-semibold text-green-600">{dashboardStats.available_books}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Borrowed Books</span>
                                    <span className="font-semibold text-blue-600">
                                        {dashboardStats.total_books - dashboardStats.available_books}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Availability Rate</span>
                                        <span>{availabilityPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${availabilityPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Activity Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Active Borrowers</span>
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-purple-500 mr-1" />
                                        <span className="font-semibold">{dashboardStats.active_borrowers}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Transactions</span>
                                    <div className="flex items-center">
                                        <ArrowLeftRight className="w-4 h-4 text-orange-500 mr-1" />
                                        <span className="font-semibold">{dashboardStats.total_transactions}</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <div className="flex items-center text-sm text-green-600">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        <span>Library is {availabilityPercentage >= 50 ? 'well-stocked' : 'getting busy'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Management */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Categories Management</CardTitle>
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
                                        key={category.category_id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{category.category_name}</h4>
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
                                                onClick={() => handleDeleteCategory(category.category_id)}
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

            {/* Quick Stats and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <span className="text-gray-600 block">Books Added Today</span>
                                    <span className="text-2xl font-bold text-blue-600">{quickStats.books_added_today}</span>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div>
                                    <span className="text-gray-600 block">Books Borrowed Today</span>
                                    <span className="text-2xl font-bold text-green-600">{quickStats.books_borrowed_today}</span>
                                </div>
                                <BookOpen className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <span className="text-gray-600 block">Books Returned Today</span>
                                    <span className="text-2xl font-bold text-purple-600">{quickStats.books_returned_today}</span>
                                </div>
                                <BookMarked className="w-8 h-8 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Library Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-gray-900 mb-2">
                                    {availabilityPercentage}%
                                </div>
                                <div className="text-sm text-gray-600">Book Availability Rate</div>
                                <div className="mt-2 text-xs text-gray-500">
                                    {availabilityPercentage >= 70 ? 'Excellent' :
                                        availabilityPercentage >= 40 ? 'Good' :
                                            'Needs Attention'}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <div className="text-lg font-bold text-orange-600">
                                        {dashboardStats.active_borrowers}
                                    </div>
                                    <div className="text-xs text-gray-600">Active Readers</div>
                                </div>
                                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                    <div className="text-lg font-bold text-indigo-600">
                                        {Math.round((dashboardStats.total_transactions / Math.max(dashboardStats.total_books, 1)) * 100)}%
                                    </div>
                                    <div className="text-xs text-gray-600">Usage Rate</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}