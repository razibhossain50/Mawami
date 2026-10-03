"use client"
import type { SVGProps } from "react";
import type { Selection, ChipProps, SortDescriptor } from "@heroui/react";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, DropdownTrigger,
    Dropdown, DropdownMenu, DropdownItem, Chip, User, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem
} from "@heroui/react";
import { Plus, EllipsisVertical, Search, ChevronDown, Trash2 } from "lucide-react";
import { logger } from '@/services/logger';
import { adminApi } from '@/services/api-client';
import { handleApiError } from '@/services/error-handler';


type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};


function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}


// Columns based on your database schema

const columns = [
    { name: "ID", uid: "id", sortable: true },
    { name: "FULL NAME", uid: "fullName", sortable: true },
    { name: "EMAIL", uid: "email", sortable: true },
    { name: "ROLE", uid: "role", sortable: true },
    { name: "CREATED AT", uid: "createdAt", sortable: true },
    { name: "UPDATED AT", uid: "updatedAt", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

// Role options based on your database

const roleOptions = [
    { name: "User", uid: "user" },
    { name: "Admin", uid: "admin" },
    { name: "Superadmin", uid: "superadmin" },
];

// User interface based on your database schema
interface DatabaseUser {
    id: number;
    email: string | null;
    username: string | null;
    password: string; // Won't display this
    role: string;
    createdAt: string;
    updatedAt: string;
    fullName: string | null;
}

const roleColorMap: Record<string, ChipProps["color"]> = {
    user: "default",
    admin: "primary",
    superadmin: "success",
};

export default function Users() {
    const [users, setUsers] = React.useState<DatabaseUser[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
    const [roleFilter, setRoleFilter] = React.useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "id",
        direction: "ascending",
    });
    const [page, setPage] = React.useState(1);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<DatabaseUser | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Add user modal state
    const [addUserModalOpen, setAddUserModalOpen] = React.useState(false);
    const [isCreatingUser, setIsCreatingUser] = React.useState(false);
    // Signed-in admin, from the admin auth context
    const { user: currentUser } = useAuth();

    // Add user form state
    const [newUserForm, setNewUserForm] = React.useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

    // Edit user modal state
    const [editUserModalOpen, setEditUserModalOpen] = React.useState(false);
    const [userToEdit, setUserToEdit] = React.useState<DatabaseUser | null>(null);
    const [isUpdatingUser, setIsUpdatingUser] = React.useState(false);

    // Edit user form state
    const [editUserForm, setEditUserForm] = React.useState({
        fullName: '',
        email: '',
        role: ''
    });
    const [editFormErrors, setEditFormErrors] = React.useState<Record<string, string>>({});


    // Fetch all users from API
    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                // Get admin authentication token
                const token = localStorage.getItem('admin_user_access_token');

                if (!token) {
                    setError('No authentication token found. Please login as admin.');
                    setLoading(false);
                    return;
                }

                logger.info('Fetching users', { hasToken: !!token }, 'AdminUsersPage');

                const data = await adminApi.get('/users') as DatabaseUser[];
                setUsers(data);
                logger.info('Successfully fetched users', { count: data.length }, 'AdminUsersPage');
            } catch (err) {
                const appError = handleApiError(err, 'AdminUsersPage');
                logger.error('Error fetching users', appError, 'AdminUsersPage');
                setError(appError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Handle user deletion
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            logger.info('Delete user initiated', {
                currentUserRole: currentUser?.role,
                hasToken: !!token,
                userToDelete: { id: userToDelete.id, fullName: userToDelete.fullName }
            }, 'AdminUsersPage');

            if (!token) {
                logger.error('No authentication token found for delete operation', undefined, 'AdminUsersPage');
                alert('No authentication token found. Please login again.');
                return;
            }

            if (currentUser?.role !== 'superadmin') {
                alert('Only superadmin can delete users. Your role: ' + currentUser?.role);
                return;
            }

            await adminApi.delete(`/users/${userToDelete.id}`);
            
            // Remove user from local state
            setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
            setDeleteModalOpen(false);
            setUserToDelete(null);
            logger.info('User deleted successfully', { userId: userToDelete.id }, 'AdminUsersPage');
            alert('User deleted successfully!');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error deleting user', appError, 'AdminUsersPage');
            alert('Network error. Please check if the backend server is running.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Validate add user form
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!newUserForm.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!newUserForm.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!newUserForm.password) {
            errors.password = 'Password is required';
        } else if (newUserForm.password.length < 5) {
            errors.password = 'Password must be at least 5 characters long';
        }

        if (!newUserForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (newUserForm.password !== newUserForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle add user form submission
    const handleAddUser = async () => {
        if (!validateForm()) return;

        try {
            setIsCreatingUser(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            if (!token) {
                logger.error('No authentication token found for create user operation', undefined, 'AdminUsersPage');
                return;
            }

            const newUser = await adminApi.post('/users', {
                fullName: newUserForm.fullName,
                email: newUserForm.email,
                password: newUserForm.password,
                confirmPassword: newUserForm.confirmPassword,
                role: 'admin' // Set role to admin as specified
            }) as DatabaseUser;

            // Add new user to local state
            setUsers(prev => [...prev, newUser]);
            // Reset form and close modal
            setNewUserForm({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
            setFormErrors({});
            setAddUserModalOpen(false);
            logger.info('User created successfully', { userId: newUser.id }, 'AdminUsersPage');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error creating user', appError, 'AdminUsersPage');
            alert(appError.message || 'Error creating user. Please try again.');
        } finally {
            setIsCreatingUser(false);
        }
    };

    // Handle form input changes
    const handleFormChange = (field: string, value: string) => {
        setNewUserForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle edit form input changes
    const handleEditFormChange = (field: string, value: string) => {
        setEditUserForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (editFormErrors[field]) {
            setEditFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate edit user form
    const validateEditForm = () => {
        const errors: Record<string, string> = {};

        if (!editUserForm.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!editUserForm.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!editUserForm.role) {
            errors.role = 'Role is required';
        }

        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle edit user form submission
    const handleEditUser = async () => {
        if (!validateEditForm() || !userToEdit) return;

        try {
            setIsUpdatingUser(true);
            // Get admin authentication token
            const token = localStorage.getItem('admin_user_access_token');

            if (!token) {
                logger.error('No authentication token found for update user operation', undefined, 'AdminUsersPage');
                return;
            }

            const updatedUser = await adminApi.put(`/users/${userToEdit.id}`, {
                fullName: editUserForm.fullName,
                email: editUserForm.email,
                role: editUserForm.role
            }) as Partial<DatabaseUser>;
            // Update user in local state
            setUsers(prev => prev.map(user =>
                user.id === userToEdit.id
                    ? { ...user, ...updatedUser }
                    : user
            ));
            // Reset form and close modal
            setEditUserForm({
                fullName: '',
                email: '',
                role: ''
            });
            setEditFormErrors({});
            setEditUserModalOpen(false);
            setUserToEdit(null);
            logger.info('User updated successfully', { userId: userToEdit.id }, 'AdminUsersPage');
        } catch (error) {
            const appError = handleApiError(error, 'AdminUsersPage');
            logger.error('Error updating user', appError, 'AdminUsersPage');
            alert(appError.message || 'Error updating user. Please try again.');
        } finally {
            setIsUpdatingUser(false);
        }
    };

    // Handle opening edit modal
    const handleOpenEditModal = (user: DatabaseUser) => {
        setUserToEdit(user);
        setEditUserForm({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role
        });
        setEditFormErrors({});
        setEditUserModalOpen(true);
    };

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        return columns;
    }, []);

    const filteredItems = React.useMemo(() => {
        let filteredUsers = [...users];

        if (hasSearchFilter) {
            filteredUsers = filteredUsers.filter((user) =>
                (user.fullName?.toLowerCase().includes(filterValue.toLowerCase()) || false) ||
                (user.email?.toLowerCase().includes(filterValue.toLowerCase()) || false)
            );
        }
        if (roleFilter !== "all" && Array.from(roleFilter).length !== roleOptions.length) {
            filteredUsers = filteredUsers.filter((user) =>
                Array.from(roleFilter).includes(user.role),
            );
        }

        return filteredUsers;
    }, [users, filterValue, roleFilter, hasSearchFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a: DatabaseUser, b: DatabaseUser) => {
            let first: string | number = a[sortDescriptor.column as keyof DatabaseUser] as string | number;
            let second: string | number = b[sortDescriptor.column as keyof DatabaseUser] as string | number;

            // Handle null values
            if (first === null || first === undefined) first = "";
            if (second === null || second === undefined) second = "";

            // Convert to string for comparison if needed
            if (typeof first === 'string') first = first.toLowerCase();
            if (typeof second === 'string') second = second.toLowerCase();

            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderCell = React.useCallback((user: DatabaseUser, columnKey: React.Key) => {
        const cellValue = user[columnKey as keyof DatabaseUser];

        switch (columnKey) {
            case "fullName":
                return (
                    <div>
                        {user.fullName || "No name"}
                    </div>

                );
            case "email":
                return (
                    <div className="flex flex-col">
                        <span className="text-small">
                            {user.email || "No email"}
                        </span>
                    </div>
                );
            case "role":
                return (
                    <Chip
                        className="capitalize"
                        color={roleColorMap[user.role] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {user.role}
                    </Chip>
                );
            case "createdAt":
            case "updatedAt":
                return (
                    <span className="text-small">
                        {formatDate(cellValue as string)}
                    </span>
                );
            case "actions":
                // Only show actions dropdown for superadmins
                if (currentUser?.role === 'superadmin') {
                    return (
                        <div className="relative flex justify-end items-center gap-2">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVertical className="text-default-300" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu onAction={(key) => {
                                    if (key === "edit") {
                                        handleOpenEditModal(user);
                                    } else if (key === "delete") {
                                        setUserToDelete(user);
                                        setDeleteModalOpen(true);
                                    }
                                }}>
                                    <DropdownItem key="edit">Edit</DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<Trash2 className="w-4 h-4" />}
                                    >
                                        Delete
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    );
                } else {
                    // Return empty div for non-superadmins (no actions available)
                    return <div></div>;
                }
            default:
                return cellValue;
        }
    }, [currentUser]);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">

                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Search by name or email..."
                        startContent={<Search />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                                    Role
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Role Filter"
                                closeOnSelect={false}
                                selectedKeys={roleFilter}
                                selectionMode="multiple"
                                onSelectionChange={setRoleFilter}
                            >
                                {roleOptions.map((role) => (
                                    <DropdownItem key={role.uid} className="capitalize">
                                        {capitalize(role.name)}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>

                        {/* Only show Add New User button for superadmins */}
                        {currentUser?.role === 'superadmin' && (
                            <Button
                                color="primary"
                                endContent={<Plus />}
                                onPress={() => setAddUserModalOpen(true)}
                            >
                                Add New User
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {users.length} users</span>
                    <label className="flex items-center text-default-400 text-small">
                        Rows per page:
                        <select
                            className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
                            onChange={onRowsPerPageChange}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </label>
                </div>
            </div>
        );
    }, [currentUser, filterValue, onSearchChange, roleFilter, users.length, onRowsPerPageChange, onClear]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400">
                    {selectedKeys === "all"
                        ? "All items selected"
                        : `${selectedKeys.size} of ${filteredItems.length} selected`}
                </span>
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                        Previous
                    </Button>
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [selectedKeys, filteredItems.length, page, pages, onPreviousPage, onNextPage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading users...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <>
            <Table
                isHeaderSticky
                aria-label="Admin users table with delete functionality"
                bottomContent={bottomContent}
                bottomContentPlacement="outside"
                classNames={{
                    wrapper: "max-h-[382px]",
                }}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSelectionChange={setSelectedKeys}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody emptyContent={"No users found"} items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-lg font-semibold text-danger">Confirm Delete User</h3>
                    </ModalHeader>
                    <ModalBody>
                        {userToDelete && (
                            <div className="space-y-4">
                                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600">ID:</span>
                                            <span className="ml-2 font-semibold">{userToDelete.id}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="ml-2 font-semibold">{userToDelete.fullName || "No name"}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="ml-2 font-semibold">
                                                {userToDelete.email || "No email"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Role:</span>
                                            <Chip
                                                className="ml-2"
                                                color={roleColorMap[userToDelete.role] || "default"}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {userToDelete.role}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => setDeleteModalOpen(false)}
                            isDisabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteUser}
                            isLoading={isDeleting}
                            startContent={!isDeleting ? <Trash2 className="w-4 h-4" /> : null}
                        >
                            {isDeleting ? "Deleting..." : "Delete User"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Add User Modal */}
            <Modal
                isOpen={addUserModalOpen}
                onClose={() => {
                    setAddUserModalOpen(false);
                    setNewUserForm({
                        fullName: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                    });
                    setFormErrors({});
                }}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-lg font-semibold text-primary">Add New Admin User</h3>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Full Name"
                                    placeholder="Enter full name"
                                    value={newUserForm.fullName}
                                    onValueChange={(value) => handleFormChange('fullName', value)}
                                    isInvalid={!!formErrors.fullName}
                                    errorMessage={formErrors.fullName}
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Email"
                                    placeholder="Enter email address"
                                    type="email"
                                    value={newUserForm.email}
                                    onValueChange={(value) => handleFormChange('email', value)}
                                    isInvalid={!!formErrors.email}
                                    errorMessage={formErrors.email}
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Password"
                                    placeholder="Enter password"
                                    type="password"
                                    value={newUserForm.password}
                                    onValueChange={(value) => handleFormChange('password', value)}
                                    isInvalid={!!formErrors.password}
                                    errorMessage={formErrors.password}
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Confirm Password"
                                    placeholder="Confirm password"
                                    type="password"
                                    value={newUserForm.confirmPassword}
                                    onValueChange={(value) => handleFormChange('confirmPassword', value)}
                                    isInvalid={!!formErrors.confirmPassword}
                                    errorMessage={formErrors.confirmPassword}
                                    variant="bordered"
                                />
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> The new user will be created with <strong>Admin</strong> role and will have access to the admin panel.
                                </p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => {
                                setAddUserModalOpen(false);
                                setNewUserForm({
                                    fullName: '',
                                    email: '',
                                    password: '',
                                    confirmPassword: ''
                                });
                                setFormErrors({});
                            }}
                            isDisabled={isCreatingUser}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleAddUser}
                            isLoading={isCreatingUser}
                            startContent={!isCreatingUser ? <Plus className="w-4 h-4" /> : null}
                        >
                            {isCreatingUser ? "Creating..." : "Create Admin User"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={editUserModalOpen}
                onClose={() => {
                    setEditUserModalOpen(false);
                    setEditUserForm({
                        fullName: '',
                        email: '',
                        role: ''
                    });
                    setEditFormErrors({});
                    setUserToEdit(null);
                }}
                size="md"
            >
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-lg font-semibold text-warning">Edit User</h3>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Full Name"
                                    placeholder="Enter full name"
                                    value={editUserForm.fullName}
                                    onValueChange={(value) => handleEditFormChange('fullName', value)}
                                    isInvalid={!!editFormErrors.fullName}
                                    errorMessage={editFormErrors.fullName}
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Email"
                                    placeholder="Enter email address"
                                    type="email"
                                    value={editUserForm.email}
                                    onValueChange={(value) => handleEditFormChange('email', value)}
                                    isInvalid={!!editFormErrors.email}
                                    errorMessage={editFormErrors.email}
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Select
                                    label="Role"
                                    placeholder="Select user role"
                                    selectedKeys={editUserForm.role ? [editUserForm.role] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        handleEditFormChange('role', selectedKey);
                                    }}
                                    isInvalid={!!editFormErrors.role}
                                    errorMessage={editFormErrors.role}
                                    variant="bordered"
                                >
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.uid}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {userToEdit && (
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Editing User:</strong> {userToEdit.fullName || "No name"} ({userToEdit.email})
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Current Role: <strong>{userToEdit.role}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => {
                                setEditUserModalOpen(false);
                                setEditUserForm({
                                    fullName: '',
                                    email: '',
                                    role: ''
                                });
                                setEditFormErrors({});
                                setUserToEdit(null);
                            }}
                            isDisabled={isUpdatingUser}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="warning"
                            onPress={handleEditUser}
                            isLoading={isUpdatingUser}
                        >
                            {isUpdatingUser ? "Updating..." : "Update User"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}