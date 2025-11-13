import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/utils/axios';

interface Category {
    category_id: number;
    category_name: string;
}

interface Book {
    book_id: number;
    category_id: string;
    category_name?: string;
    title: string;
    description: string;
    author: string;
    date_published: string;
    date_stamped: string;
    date_modified: string;
    book_image: string;
    isbn: string;
    ebook_link: string;
    status: 'available' | 'borrowed' | 'reserved' | 'unavailable';
    is_archived: boolean;
}

interface PaginationInfo {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export default function Books() {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Pagination and filtering states
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [formData, setFormData] = useState({
        category_id: '',
        title: '',
        description: '',
        author: '',
        date_published: '',
        isbn: '',
        ebook_link: '',
        status: 'available' as Book['status']
    });

    // Status options with colors
    const statusOptions = [
        { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
        { value: 'borrowed', label: 'Borrowed', color: 'bg-blue-100 text-blue-800' },
        { value: 'reserved', label: 'Reserved', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'unavailable', label: 'Unavailable', color: 'bg-red-100 text-red-800' },
    ];

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch books with pagination and filters
    useEffect(() => {
        fetchBooks();
    }, [debouncedSearch, selectedCategory, pagination.current_page, pagination.per_page]);

    // Fetch categories for dropdown
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchBooks = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.current_page.toString(),
                per_page: pagination.per_page.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(selectedCategory && { category_id: selectedCategory })
            });

            const response = await api.get(`/books?${params}`);
            if (response.data.success) {
                setBooks(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            console.error('Error fetching books:', error);
            setError('Failed to fetch books');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/dropdown/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            setError('Failed to fetch categories');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const submitData = new FormData();

            // Append form data
            Object.entries(formData).forEach(([key, value]) => {
                if (value) submitData.append(key, value);
            });

            // Append image file if exists
            if (imageFile) {
                submitData.append('book_image', imageFile);
            }

            if (editingBook) {
                // Update book
                const response = await api.post(`/update/books/${editingBook.book_id}`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.success) {
                    fetchBooks(); // Refresh the list
                    resetForm();
                } else {
                    setError(response.data.message || 'Failed to update book');
                }
            } else {
                // Create new book
                const response = await api.post('/create/books', submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.success) {
                    fetchBooks(); // Refresh the list
                    resetForm();
                } else {
                    setError(response.data.message || 'Failed to create book');
                }
            }
        } catch (error: any) {
            console.error('Error saving book:', error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0] as string[];
                setError(firstError[0] || 'Validation failed');
            } else {
                setError(error.response?.data?.message || 'Failed to save book');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            category_id: '',
            title: '',
            description: '',
            author: '',
            date_published: '',
            isbn: '',
            ebook_link: '',
            status: 'available'
        });
        setEditingBook(null);
        setImageFile(null);
        setImagePreview('');
        setIsDialogOpen(false);
        setError('');
    };

    const handleEdit = (book: Book) => {
        setEditingBook(book);
        setFormData({
            category_id: book.category_id.toString(),
            title: book.title,
            description: book.description || '',
            author: book.author,
            date_published: book.date_published ? book.date_published.split('T')[0] : '',
            isbn: book.isbn || '',
            ebook_link: book.ebook_link || '',
            status: book.status
        });
        if (book.book_image) {
            setImagePreview(book.book_image);
        }
        setIsDialogOpen(true);
    };

    const handleArchive = async (id: number) => {
        if (!confirm('Are you sure you want to archive this book?')) return;

        try {
            const response = await api.post(`/archive/books/${id}`);
            if (response.data.success) {
                fetchBooks(); // Refresh the list
            } else {
                setError('Failed to archive book');
            }
        } catch (error: any) {
            console.error('Error archiving book:', error);
            setError('Failed to archive book');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handlePerPageChange = (value: string) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(value),
            current_page: 1 // Reset to first page when changing page size
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status: Book['status']) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return (
            <Badge variant="outline" className={statusOption?.color}>
                {statusOption?.label}
            </Badge>
        );
    };

    // Generate page numbers for pagination
    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Books Management</h1>
                    <p className="text-gray-600">Manage your library collection</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Book
                </Button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by title, author, or ISBN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                    {category.category_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>


                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book ID</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Title & Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Published</TableHead>
                            <TableHead>Last Modified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {books.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                    No books found. {pagination.total === 0 ? 'Add your first book to get started.' : 'Try adjusting your filters.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            books.map((book) => (
                                <TableRow key={book.book_id}>
                                    <TableCell className="font-mono text-sm">{book.book_id}</TableCell>
                                    <TableCell>
                                        {book.book_image ? (
                                            <img
                                                src={book.book_image}
                                                alt={book.title}
                                                className="w-12 h-16 object-cover rounded border"
                                            />
                                        ) : (
                                            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium text-gray-900">{book.title}</div>
                                            {book.description && (
                                                <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                                    {book.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{book.category_name}</TableCell>
                                    <TableCell>{book.author}</TableCell>
                                    <TableCell className="font-mono text-sm">{book.isbn || '-'}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(book.status)}
                                    </TableCell>
                                    <TableCell>{book.date_published ? formatDate(book.date_published) : '-'}</TableCell>
                                    <TableCell>{formatDate(book.date_modified)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(book)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleArchive(book.book_id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {generatePageNumbers().map(page => (
                                <Button
                                    key={page}
                                    variant={pagination.current_page === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Book Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                        <DialogDescription>
                            {editingBook ? 'Update the book information below.' : 'Fill in the details to add a new book to your library.'}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {/* Category */}
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category *</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) => handleSelectChange('category_id', value)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Description */}
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Author and Date Published */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="author">Author *</Label>
                                    <Input
                                        id="author"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date_published">Date Published</Label>
                                    <Input
                                        id="date_published"
                                        name="date_published"
                                        type="date"
                                        value={formData.date_published}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* ISBN and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="isbn">ISBN</Label>
                                    <Input
                                        id="isbn"
                                        name="isbn"
                                        value={formData.isbn}
                                        onChange={handleInputChange}
                                        placeholder="978-3-16-148410-0"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange('status', value as Book['status'])}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* eBook Link */}
                            <div className="grid gap-2">
                                <Label htmlFor="ebook_link">eBook Link</Label>
                                <Input
                                    id="ebook_link"
                                    name="ebook_link"
                                    type="url"
                                    value={formData.ebook_link}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/ebook"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Book Image Upload */}
                            <div className="grid gap-2">
                                <Label htmlFor="book_image">Book Image</Label>
                                <Input
                                    id="book_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={isLoading}
                                />
                                {imagePreview && (
                                    <div className="mt-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-40 object-cover rounded border"
                                        />
                                    </div>
                                )}
                                <p className="text-sm text-gray-500">
                                    Supported formats: JPEG, PNG, JPG, GIF, SVG (Max: 2MB)
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}